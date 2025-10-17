// src/utils/locationSyncUtils.js
import { ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { usePermissions } from '@/composables/usePermissions';

// Reactive state für das Modal
export const showLocationSyncModal = ref(false);
let locationSyncResolver = null;

// Prüft ob die Sync-Richtung korrekt ist
export function checkLocationSyncDirection() {
  const store = apiStore();
  const syncDirection = store.profileInfo?.TelescopeSettings?.TelescopeLocationSyncDirection;
  console.log('checkLocationSyncDirection', syncDirection);
  return syncDirection === 'PROMPT';
}

// Setzt die neue Sync-Richtung
export async function setLocationSyncDirection(direction) {
  await apiService.profileChangeValue(
    'TelescopeSettings-TelescopeLocationSyncDirection',
    direction
  );
}

// Zeigt das Modal an und wartet auf Benutzerantwort
function showLocationSyncConfirmation() {
  return new Promise((resolve) => {
    locationSyncResolver = resolve;
    showLocationSyncModal.value = true;
  });
}

// Option wurde gewählt
export function selectLocationSyncOption(value) {
  showLocationSyncModal.value = false;
  if (locationSyncResolver) {
    setLocationSyncDirection(value);
    locationSyncResolver(true);
    locationSyncResolver = null;
  }
}

// Abbrechen
export function cancelLocationSync() {
  showLocationSyncModal.value = false;
  if (locationSyncResolver) {
    locationSyncResolver(false);
    locationSyncResolver = null;
  }
}

// Get current location with permission handling
export async function getDeviceLocation() {
  const { getCurrentLocation, isNative } = usePermissions();

  if (!isNative) {
    console.log('Not on native platform, skipping location permission');
    return null;
  }

  try {
    const result = await getCurrentLocation();

    if (!result.success) {
      console.warn('Failed to get location:', result.error);
      return null;
    }

    return {
      latitude: result.latitude,
      longitude: result.longitude,
      altitude: result.altitude || 0,
    };
  } catch (error) {
    console.error('Error getting device location:', error);
    return null;
  }
}

// Hauptfunktion für Mount-Verbindungscheck
export async function checkMountConnectionPermission() {
  if (checkLocationSyncDirection()) {
    return await showLocationSyncConfirmation();
  }
  return true;
}
