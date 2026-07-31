import test from 'node:test';
import assert from 'node:assert/strict';
import { reactive } from 'vue';
import { installBrowserGlobals } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { identifySelectedRig, initializeRigConnectionSupervisor, recoverRigConnection } =
  await import('@/services/rigConnectionSupervisor');

test('pinsdaemon recovery is inert for a non-PINS backend', async (t) => {
  let backendSwitches = 0;
  let healthProbes = 0;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    healthProbes += 1;
    throw new Error('A Windows backend must not be probed as pinsdaemon');
  };

  const instance = { id: 'windows-rig', ip: '192.168.1.20', port: 5000 };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
  };
  const backendStore = reactive({
    isPINS: false,
    async switchBackend() {
      backendSwitches += 1;
    },
  });

  await initializeRigConnectionSupervisor({ settingsStore, backendStore });
  const result = await recoverRigConnection({ timeoutMs: 10 });

  assert.equal(result, null);
  assert.equal(healthProbes, 0);
  assert.equal(backendSwitches, 0);
  assert.equal(await identifySelectedRig(), '');
  assert.equal(healthProbes, 0);
});

test('identifySelectedRig stays quiet when the daemon reports no rig identity', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ status: 'ok', service: 'pinsdaemon' }),
  });

  const instance = { id: 'legacy-rig', ip: '192.168.178.50', port: 5000 };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint(_id, { host }) {
      instance.ip = host;
      this.connection.ip = host;
    },
  };
  const backendStore = reactive({
    isPINS: true,
    isBackendReachable: false,
    async switchBackend() {},
  });

  await initializeRigConnectionSupervisor({ settingsStore, backendStore });

  // An older daemon has no rigId, but WiFi actions must still go through.
  assert.equal(await identifySelectedRig(), '');
  const result = await recoverRigConnection({ timeoutMs: 1000 });
  assert.equal(result.host, '192.168.178.50');
});

test('a probe round that never settles cannot outlive the recovery deadline', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  // A native mDNS scan or a socket that never reports back used to keep this
  // promise pending forever, which left the PINS screen disabled for good.
  globalThis.fetch = () => new Promise(() => {});

  const instance = { id: 'stuck-rig', ip: '192.168.178.77', port: 5000, rigId: 'pins-stuck' };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint: () => {},
  };
  const backendStore = reactive({
    isPINS: true,
    isBackendReachable: false,
    async switchBackend() {},
  });

  await initializeRigConnectionSupervisor({ settingsStore, backendStore });

  const startedAt = Date.now();
  await assert.rejects(() => recoverRigConnection({ timeoutMs: 300 }));
  assert.ok(Date.now() - startedAt < 5000, 'recovery must settle at its deadline');
});

test('recovery keeps a healthy active endpoint instead of racing its aliases', async (t) => {
  let backendSwitches = 0;
  const probedUrls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    probedUrls.push(String(url));
    return {
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'pinsdaemon',
        rigId: 'pins-ce29c',
      }),
    };
  };

  const instance = {
    id: 'pins-rig',
    ip: '192.168.178.109',
    port: 5000,
    rigId: 'pins-ce29c',
    preferredEndpoint: { host: 'pins-ce29c.local' },
    candidateHosts: ['pins.local', '10.42.0.1'],
  };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint(_id, { host }) {
      instance.ip = host;
      this.connection.ip = host;
    },
  };
  const backendStore = reactive({
    isPINS: true,
    isBackendReachable: false,
    async switchBackend() {
      backendSwitches += 1;
    },
  });

  await initializeRigConnectionSupervisor({ settingsStore, backendStore });
  const result = await recoverRigConnection({ timeoutMs: 1000 });

  assert.equal(result.host, '192.168.178.109');
  assert.equal(settingsStore.connection.ip, '192.168.178.109');
  assert.equal(backendSwitches, 0);
  assert.ok(probedUrls.length >= 1);
  assert.ok(probedUrls.every((url) => url.includes('192.168.178.109:8000/health')));
});
