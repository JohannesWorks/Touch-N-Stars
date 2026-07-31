import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasNetworkModeInfo,
  isClientModeActive,
  isHotspotModeActive,
  observedNetworkMode,
} from '../networkModeState.js';

test('the daemon-reported mode wins over anything inferred', () => {
  const mode = { desiredMode: 'auto', observedMode: 'client' };

  assert.equal(observedNetworkMode(null, mode), 'client');
  assert.equal(isClientModeActive(null, mode), true);
  // The rig is in client mode, so no hotspot and therefore no DHCP leases.
  assert.equal(isHotspotModeActive(null, mode), false);
});

test('dual mode counts as both client and hotspot', () => {
  const mode = { observedMode: 'dual' };

  assert.equal(isClientModeActive(null, mode), true);
  assert.equal(isHotspotModeActive(null, mode), true);
});

test('hotspot mode hides the client controls', () => {
  const mode = { observedMode: 'hotspot' };

  assert.equal(isClientModeActive(null, mode), false);
  assert.equal(isHotspotModeActive(null, mode), true);
});

test('without the mode API the connection roles are used instead', () => {
  const status = {
    connected: true,
    connections: [
      { role: 'client', connected: true, ssid: 'home' },
      { role: 'hotspot', connected: false },
    ],
  };

  assert.equal(hasNetworkModeInfo(status, null), false);
  assert.equal(isClientModeActive(status, null), true);
  assert.equal(isHotspotModeActive(status, null), false);
});

test('nothing is claimed when the daemon reported nothing at all', () => {
  assert.equal(hasNetworkModeInfo(null, null), false);
  assert.equal(isClientModeActive(null, null), false);
  assert.equal(isHotspotModeActive(null, null), false);
  assert.equal(observedNetworkMode(undefined, undefined), '');
});

test('the status payload is used when only it carries the mode', () => {
  assert.equal(observedNetworkMode({ observedMode: 'hotspot' }, null), 'hotspot');
  assert.equal(hasNetworkModeInfo({ observedMode: 'hotspot' }, null), true);
});
