import { ninaObserverToAtlas } from './contracts.js';

/** Reuse the configured site, then the existing mobile location service once per view lifetime. */
export function createSkyObserverResolver(
  getSettings,
  requestLocation = async () => {
    const { getCurrentLocation } = await import('../../utils/location.js');
    return getCurrentLocation();
  }
) {
  let deviceObserver = null;
  return async () => {
    try {
      return ninaObserverToAtlas(getSettings());
    } catch {
      /* A site is not configured. */
    }
    if (deviceObserver) return deviceObserver;
    let position;
    try {
      position = await requestLocation();
    } catch {
      throw Object.assign(new Error('Observer location required'), { code: 'LOCATION_REQUIRED' });
    }
    if (!position)
      throw Object.assign(new Error('Observer location required'), { code: 'LOCATION_REQUIRED' });
    try {
      deviceObserver = ninaObserverToAtlas({
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude,
        Elevation: position.coords.altitude ?? 0,
      });
      return deviceObserver;
    } catch {
      throw Object.assign(new Error('Observer location required'), { code: 'LOCATION_REQUIRED' });
    }
  };
}
