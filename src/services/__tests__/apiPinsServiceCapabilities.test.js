import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { default: axios } = await import('axios');
const {
  default: apiPinsService,
  resetPinsDaemonCapabilities,
  supportsPinsNetworkMode,
} = await import('@/services/apiPinsService');
const { useSettingsStore } = await import('@/store/settingsStore');
const { apiStore } = await import('@/store/store');

freshPinia();
const settingsStore = useSettingsStore();
const store = apiStore();

function seedDaemon(ip) {
  settingsStore.connection.ip = ip;
  settingsStore.connection.port = 5000;
  settingsStore.connection.instances = [];
  settingsStore.selectedInstanceId = null;
  store.apiPort = 1888;
  resetPinsDaemonCapabilities();
}

function httpError(status) {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status, data: '' };
  return error;
}

test('a daemon without /wifi/mode is detected once and not probed again', async (t) => {
  seedDaemon('10.0.0.5');
  let calls = 0;
  t.mock.method(axios, 'get', async () => {
    calls += 1;
    throw httpError(404);
  });

  assert.equal(await apiPinsService.getPinsWifiModeIfSupported(), null);
  assert.equal(supportsPinsNetworkMode(), false);

  assert.equal(await apiPinsService.getPinsWifiModeIfSupported(), null);
  assert.equal(calls, 1, 'the negative result is cached');
});

test('a real failure is not mistaken for a missing endpoint', async (t) => {
  seedDaemon('10.0.0.5');
  t.mock.method(axios, 'get', async () => {
    throw httpError(500);
  });

  await assert.rejects(() => apiPinsService.getPinsWifiModeIfSupported(), /500/);
  assert.notEqual(supportsPinsNetworkMode(), false);
});

test('switching to another rig re-evaluates the capability', async (t) => {
  seedDaemon('10.0.0.5');
  t.mock.method(axios, 'get', async (url) => {
    if (url.includes('10.0.0.5')) throw httpError(404);
    return { status: 200, data: { desiredMode: 'auto', observedMode: 'client' } };
  });

  assert.equal(await apiPinsService.getPinsWifiModeIfSupported(), null);
  assert.equal(supportsPinsNetworkMode(), false);

  settingsStore.connection.ip = '10.0.0.9';
  const mode = await apiPinsService.getPinsWifiModeIfSupported();

  assert.equal(mode.desiredMode, 'auto');
  assert.equal(supportsPinsNetworkMode(), true);
});
