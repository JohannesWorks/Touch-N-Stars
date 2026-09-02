import test from 'node:test';
import assert from 'node:assert/strict';
import {
  USER_CONFIRMED_CANDIDATE_SOURCES,
  buildPinsEndpointCandidates,
  probePinsHealth,
  resolvePinsEndpoint,
} from '@/services/rigEndpointResolver';

test('endpoint candidates keep the active address and use a rig-specific mDNS fallback', () => {
  const candidates = buildPinsEndpointCandidates({
    instance: {
      ip: '192.168.1.44',
      rigId: 'pins-ce29c',
      preferredEndpoint: { host: 'rig.local' },
      candidateHosts: ['192.168.1.44', '10.42.0.1'],
    },
    currentHost: '192.168.1.10',
    pageHost: 'rig-page.local',
    mdnsHosts: ['192.168.1.44', 'pins.local'],
  });

  assert.deepEqual(
    candidates.map(({ host, source }) => [host, source]),
    [
      ['192.168.1.10', 'active'],
      ['rig.local', 'preferred'],
      ['192.168.1.44', 'instance'],
      ['10.42.0.1', 'remembered'],
      ['rig-page.local', 'page'],
      ['pins-ce29c.local', 'rig-mdns'],
      ['pins.local', 'mdns'],
    ]
  );
});

test('generic pins.local is never injected when several PINS rigs can share a network', () => {
  const candidates = buildPinsEndpointCandidates({
    instance: { rigId: 'pins-ce29c' },
    includeFieldFallback: true,
  });

  assert.deepEqual(
    candidates.map(({ host, source }) => [host, source]),
    [
      ['pins-ce29c.local', 'rig-mdns'],
      ['10.42.0.1', 'field-hotspot'],
    ]
  );
});

test('health probes are unauthenticated and do not send browser credentials', async () => {
  let request;
  const result = await probePinsHealth(
    { host: '10.42.0.1', source: 'field-hotspot' },
    {
      fetchImpl: async (url, options) => {
        request = { url, options };
        return {
          ok: true,
          json: async () => ({
            status: 'ok',
            service: 'pinsdaemon',
            rigId: 'rig-123',
          }),
        };
      },
    }
  );

  assert.equal(request.url, 'http://10.42.0.1:8000/health');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(result.health.rigId, 'rig-123');
});

test('resolver rejects a reachable different rig and selects the matching identity', async () => {
  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => ({
      status: 'ok',
      service: 'pinsdaemon',
      rigId: url.includes('wrong.local') ? 'rig-wrong' : 'rig-right',
    }),
  });

  const result = await resolvePinsEndpoint({
    candidates: [{ host: 'wrong.local' }, { host: '10.42.0.1' }],
    expectedRigId: 'rig-right',
    fetchImpl,
    concurrency: 1,
  });

  assert.equal(result.host, '10.42.0.1');
  assert.match(result.attempts[0].error, /identity mismatch/i);
});

test('an instance without a known rigId never races addresses that may be another rig', () => {
  const candidates = buildPinsEndpointCandidates({
    instance: {
      ip: '192.168.2.129',
      // Both were written by promoteInstanceEndpoint(), so a past mis-promotion
      // can have parked a foreign rig here.
      preferredEndpoint: { host: 'stale-rig.local' },
      candidateHosts: ['192.168.2.50'],
    },
    currentHost: '192.168.2.129',
    pageHost: 'rig-page.local',
    mdnsHosts: ['192.168.2.77', 'other-rig.local'],
    identityKnown: false,
  });

  assert.deepEqual(
    candidates.map(({ host, source }) => [host, source]),
    [
      ['192.168.2.129', 'active'],
      ['rig-page.local', 'page'],
      ['10.42.0.1', 'field-hotspot'],
    ]
  );
  assert.ok(candidates.every(({ source }) => USER_CONFIRMED_CANDIDATE_SOURCES.has(source)));
});

test('an identity mismatch is reported machine-readably so callers can prune the host', async () => {
  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => ({
      status: 'ok',
      service: 'pinsdaemon',
      rigId: url.includes('192.168.2.50') ? 'pins-other' : 'pins-mine',
    }),
  });

  const result = await resolvePinsEndpoint({
    candidates: [{ host: '192.168.2.50' }, { host: '192.168.2.77' }],
    expectedRigId: 'pins-mine',
    fetchImpl,
    concurrency: 1,
  });

  assert.equal(result.host, '192.168.2.77');
  assert.deepEqual(
    result.attempts.map(({ host, reason, rigId }) => ({ host, reason, rigId })),
    [{ host: '192.168.2.50', reason: 'identity-mismatch', rigId: 'pins-other' }]
  );
});
