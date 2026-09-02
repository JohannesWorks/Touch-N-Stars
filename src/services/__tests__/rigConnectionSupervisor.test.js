import test from 'node:test';
import assert from 'node:assert/strict';
import { reactive } from 'vue';
import { installBrowserGlobals } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { default: apiPinsService } = await import('@/services/apiPinsService');

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
  await assert.rejects(() => identifySelectedRig(), /unavailable for this backend/);
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

test('failed PINS Wi-Fi job stops recovery immediately with its classified reason', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalGetJob = apiPinsService.getPinsDaemonJob;
  const originalGetStatus = apiPinsService.getPinsWifiStatus;
  t.after(() => {
    globalThis.fetch = originalFetch;
    apiPinsService.getPinsDaemonJob = originalGetJob;
    apiPinsService.getPinsWifiStatus = originalGetStatus;
  });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ status: 'ok', service: 'pinsdaemon', rigId: 'pins-test' }),
  });
  apiPinsService.getPinsDaemonJob = async () => ({
    jobId: 'wifi-job',
    status: 'failed',
    exitCode: 1,
    errorCode: 'MISSING_CREDENTIALS',
    errorMessage: 'Saved profile has no NetworkManager secret',
  });
  apiPinsService.getPinsWifiStatus = async () => {
    throw new Error('status must not be polled after a terminal job failure');
  };

  const instance = { id: 'pins-test', ip: '192.168.1.10', port: 5000, rigId: 'pins-test' };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint() {},
  };
  const backendStore = reactive({ isPINS: true, async switchBackend() {} });
  await initializeRigConnectionSupervisor({ settingsStore, backendStore });

  await assert.rejects(
    () =>
      recoverRigConnection({ requestedMode: 'client', operationId: 'wifi-job', timeoutMs: 1000 }),
    /MISSING_CREDENTIALS/
  );
});

// Regression: with several PINS rigs on one network, a scanned instance used to
// inherit the address of a *different* rig. The identity check existed but was
// skipped whenever instance.rigId was still empty, so the fastest stranger in
// the candidate race won and was written to the instance for good.
test('an instance without a rigId never adopts another reachable rig', async (t) => {
  const probedUrls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    probedUrls.push(String(url));
    if (String(url).includes('192.168.2.50')) {
      return {
        ok: true,
        json: async () => ({ status: 'ok', service: 'pinsdaemon', rigId: 'pins-other' }),
      };
    }
    throw new Error('Rig is not reachable right now');
  };

  const instance = {
    id: 'scanned-rig',
    ip: '192.168.2.129',
    port: 5000,
    // No rigId yet - the identity probe during the scan did not get an answer.
    // A previous mis-promotion left the other rig in the remembered hosts.
    candidateHosts: ['192.168.2.129', '192.168.2.50'],
  };
  let promotions = 0;
  let backendSwitches = 0;
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint(_id, { host }) {
      promotions += 1;
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
  await assert.rejects(() => recoverRigConnection({ timeoutMs: 500 }));

  assert.equal(instance.ip, '192.168.2.129');
  assert.equal(settingsStore.connection.ip, '192.168.2.129');
  assert.equal(promotions, 0);
  assert.equal(backendSwitches, 0);
  assert.ok(
    probedUrls.every((url) => !url.includes('192.168.2.50')),
    `the foreign rig must not be probed at all, got ${probedUrls.join(', ')}`
  );
});

test('a known rigId still recovers a moved rig and reports the foreign host for pruning', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('192.168.2.50')) {
      return {
        ok: true,
        json: async () => ({ status: 'ok', service: 'pinsdaemon', rigId: 'pins-other' }),
      };
    }
    if (target.includes('192.168.2.77')) {
      return {
        ok: true,
        json: async () => ({ status: 'ok', service: 'pinsdaemon', rigId: 'pins-mine' }),
      };
    }
    throw new Error('Rig is not reachable at its old address');
  };

  const instance = {
    id: 'moved-rig',
    ip: '192.168.2.129',
    port: 5000,
    rigId: 'pins-mine',
    candidateHosts: ['192.168.2.50', '192.168.2.77'],
  };
  let rejected = null;
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
    promoteInstanceEndpoint(_id, { host, rejectedHosts }) {
      rejected = rejectedHosts;
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
  const result = await recoverRigConnection({ timeoutMs: 2000 });

  assert.equal(result.host, '192.168.2.77');
  assert.equal(instance.ip, '192.168.2.77');
  assert.deepEqual(rejected, ['192.168.2.50']);
});
