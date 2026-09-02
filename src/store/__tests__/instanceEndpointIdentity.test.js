import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();
window.location.reload = () => {};

const { useSettingsStore } = await import('@/store/settingsStore');

function setup() {
  freshPinia();
  const settingsStore = useSettingsStore();
  settingsStore.setupCompleted = true;
  settingsStore.connection.instances = [];
  settingsStore.selectedInstanceId = null;
  // Seam: record the reload instead of navigating away.
  settingsStore._reloadForInstanceSwitch = () => {};
  return settingsStore;
}

test('re-scanning a known instance adopts its fresh identity and addresses', () => {
  const settingsStore = setup();
  settingsStore.connection.instances = [
    {
      id: 'rig-1',
      name: 'My Rig',
      ip: '192.168.2.129',
      port: 5000,
      // Left over from an earlier mis-promotion: another rig's address.
      candidateHosts: ['192.168.2.129', '192.168.2.50'],
    },
  ];
  settingsStore.selectedInstanceId = 'rig-1';
  settingsStore.connection.ip = '192.168.2.129';
  settingsStore.connection.port = 5000;

  settingsStore.addInstance({
    name: 'My Rig',
    ip: '192.168.2.129',
    port: 5000,
    rigId: 'pins-mine',
    candidateHosts: ['192.168.2.129', 'fe80::1'],
  });

  const instance = settingsStore.getInstance('rig-1');
  assert.equal(settingsStore.connection.instances.length, 1);
  assert.equal(instance.rigId, 'pins-mine');
  assert.deepEqual(instance.candidateHosts, ['192.168.2.129', 'fe80::1']);
});

test('promoting an endpoint drops hosts that answered as a different rig', () => {
  const settingsStore = setup();
  settingsStore.connection.instances = [
    {
      id: 'rig-1',
      name: 'My Rig',
      ip: '192.168.2.129',
      port: 5000,
      rigId: 'pins-mine',
      candidateHosts: ['192.168.2.129', '192.168.2.50'],
    },
  ];
  settingsStore.selectedInstanceId = 'rig-1';
  settingsStore.connection.ip = '192.168.2.129';
  settingsStore.connection.port = 5000;

  const promoted = settingsStore.promoteInstanceEndpoint('rig-1', {
    host: '192.168.2.77',
    rigId: 'pins-mine',
    rejectedHosts: ['192.168.2.50'],
  });

  const instance = settingsStore.getInstance('rig-1');
  assert.equal(promoted, true);
  assert.equal(instance.ip, '192.168.2.77');
  assert.equal(settingsStore.connection.ip, '192.168.2.77');
  assert.ok(!instance.candidateHosts.includes('192.168.2.50'));
  // The address the rig previously answered on stays a valid fallback.
  assert.ok(instance.candidateHosts.includes('192.168.2.129'));
});

test('a timeout does not remove a host, only a confirmed identity mismatch does', () => {
  const settingsStore = setup();
  settingsStore.connection.instances = [
    {
      id: 'rig-1',
      name: 'My Rig',
      ip: '192.168.2.129',
      port: 5000,
      rigId: 'pins-mine',
      candidateHosts: ['192.168.2.129', '192.168.2.50'],
    },
  ];
  settingsStore.selectedInstanceId = 'rig-1';

  settingsStore.promoteInstanceEndpoint('rig-1', { host: '192.168.2.129', rigId: 'pins-mine' });

  const instance = settingsStore.getInstance('rig-1');
  assert.ok(instance.candidateHosts.includes('192.168.2.50'));
});
