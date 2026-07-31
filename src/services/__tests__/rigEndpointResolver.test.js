import test from 'node:test';
import assert from 'node:assert/strict';
import {
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

test('a daemon without a rigId is still a valid endpoint', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ status: 'ok', service: 'pinsdaemon' }),
  });

  const probe = await probePinsHealth({ host: '192.168.1.44' }, { fetchImpl });
  assert.equal(probe.host, '192.168.1.44');

  // Older daemons predate rig identities; not reporting one must not be read as
  // reporting the wrong one.
  const resolved = await resolvePinsEndpoint({
    candidates: [{ host: '192.168.1.44' }],
    expectedRigId: 'rig-right',
    fetchImpl,
    concurrency: 1,
  });
  assert.equal(resolved.host, '192.168.1.44');
});
