// Which parts of the network tab apply right now is a property of the rig, not a
// user preference. These helpers read that from the daemon's reported mode so the
// client controls and the hotspot lease list follow reality instead of a local
// toggle that resets to "off" on every app start.

const CLIENT_MODES = ['client', 'dual'];
const HOTSPOT_MODES = ['hotspot', 'dual'];

export function observedNetworkMode(wifiStatus, wifiMode) {
  return wifiMode?.observedMode || wifiStatus?.observedMode || '';
}

// Daemons without the /wifi/mode API report nothing here; callers must keep their
// previous behaviour in that case rather than guess.
export function hasNetworkModeInfo(wifiStatus, wifiMode) {
  return Boolean(observedNetworkMode(wifiStatus, wifiMode));
}

function hasConnectedRole(wifiStatus, role) {
  const connections = wifiStatus?.connections;
  if (!Array.isArray(connections)) return false;
  return connections.some((connection) => connection?.role === role && connection?.connected);
}

export function isClientModeActive(wifiStatus, wifiMode) {
  const mode = observedNetworkMode(wifiStatus, wifiMode);
  if (mode) return CLIENT_MODES.includes(mode);
  return hasConnectedRole(wifiStatus, 'client');
}

export function isHotspotModeActive(wifiStatus, wifiMode) {
  const mode = observedNetworkMode(wifiStatus, wifiMode);
  if (mode) return HOTSPOT_MODES.includes(mode);
  return hasConnectedRole(wifiStatus, 'hotspot');
}
