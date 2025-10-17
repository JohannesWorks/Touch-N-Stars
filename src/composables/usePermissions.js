import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

// Global permission state (shared across all components)
const permissions = ref({
  camera: {
    status: 'prompt', // 'prompt' | 'granted' | 'denied' | 'limited'
    checked: false,
  },
  location: {
    status: 'prompt',
    checked: false,
  },
  notifications: {
    status: 'prompt',
    checked: false,
  },
});

const isNativePlatform = () => {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android';
};

export function usePermissions() {
  /**
   * Check if we're running on a native platform
   */
  const isNative = isNativePlatform();

  /**
   * Camera Permission Handling
   * Note: @capacitor/camera is not installed, so we use a mock implementation
   */
  const checkCameraPermission = async () => {
    // Camera permission is handled by NINA backend, not by this app
    // On native platforms, assume granted (backend handles camera access)
    permissions.value.camera.status = 'granted';
    permissions.value.camera.checked = true;
    return 'granted';
  };

  const requestCameraPermission = async () => {
    // Camera permission is handled by NINA backend, not by this app
    // On native platforms, assume granted (backend handles camera access)
    permissions.value.camera.status = 'granted';
    return { granted: true, status: 'granted' };
  };

  /**
   * Location Permission Handling
   */
  const checkLocationPermission = async () => {
    if (!isNative) {
      permissions.value.location.status = 'granted';
      permissions.value.location.checked = true;
      return 'granted';
    }

    try {
      const result = await Geolocation.checkPermissions();
      permissions.value.location.status = result.location || 'prompt';
      permissions.value.location.checked = true;
      return permissions.value.location.status;
    } catch (error) {
      console.error('Error checking location permission:', error);
      permissions.value.location.status = 'denied';
      return 'denied';
    }
  };

  const requestLocationPermission = async () => {
    if (!isNative) {
      permissions.value.location.status = 'granted';
      return { granted: true, status: 'granted' };
    }

    try {
      // Check first
      const currentStatus = await checkLocationPermission();

      if (currentStatus === 'granted') {
        return { granted: true, status: 'granted' };
      }

      // Request permission
      const result = await Geolocation.requestPermissions();
      const newStatus = result.location || 'denied';
      permissions.value.location.status = newStatus;

      return {
        granted: newStatus === 'granted',
        status: newStatus,
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      permissions.value.location.status = 'denied';
      return { granted: false, status: 'denied', error };
    }
  };

  /**
   * Get current location with permission handling
   */
  const getCurrentLocation = async () => {
    try {
      const permissionResult = await requestLocationPermission();

      if (!permissionResult.granted) {
        throw new Error('Location permission denied');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      return {
        success: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Notification Permission Handling
   */
  const checkNotificationPermission = async () => {
    if (!isNative) {
      permissions.value.notifications.status = 'granted';
      permissions.value.notifications.checked = true;
      return 'granted';
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      permissions.value.notifications.status = result.display || 'prompt';
      permissions.value.notifications.checked = true;
      return permissions.value.notifications.status;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      permissions.value.notifications.status = 'denied';
      return 'denied';
    }
  };

  const requestNotificationPermission = async () => {
    if (!isNative) {
      permissions.value.notifications.status = 'granted';
      return { granted: true, status: 'granted' };
    }

    try {
      // Check first
      const currentStatus = await checkNotificationPermission();

      if (currentStatus === 'granted') {
        return { granted: true, status: 'granted' };
      }

      // Request permission
      const result = await LocalNotifications.requestPermissions();
      const newStatus = result.display || 'denied';
      permissions.value.notifications.status = newStatus;

      return {
        granted: newStatus === 'granted',
        status: newStatus,
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      permissions.value.notifications.status = 'denied';
      return { granted: false, status: 'denied', error };
    }
  };

  /**
   * Check all permissions at once (useful on app startup)
   */
  const checkAllPermissions = async () => {
    if (!isNative) {
      return {
        camera: 'granted',
        location: 'granted',
        notifications: 'granted',
      };
    }

    const [camera, location, notifications] = await Promise.all([
      checkCameraPermission(),
      checkLocationPermission(),
      checkNotificationPermission(),
    ]);

    return { camera, location, notifications };
  };

  /**
   * Open system settings for this app (useful when permission is denied)
   */
  const openAppSettings = async () => {
    if (!isNative) {
      console.warn('Opening settings only available on native platforms');
      return;
    }

    try {
      // Note: This requires @capacitor/app plugin
      const { App } = await import('@capacitor/app');
      await App.openUrl({ url: 'app-settings:' });
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  };

  /**
   * Get human-readable permission status message
   */
  const getPermissionStatusMessage = (permissionType, t) => {
    const status = permissions.value[permissionType]?.status;

    switch (status) {
      case 'granted':
        return t ? t('permissions.granted') : 'Permission granted';
      case 'denied':
        return t ? t('permissions.denied') : 'Permission denied. Please enable in settings.';
      case 'limited':
        return t ? t('permissions.limited') : 'Limited permission granted';
      case 'prompt':
      default:
        return t ? t('permissions.prompt') : 'Permission not requested yet';
    }
  };

  return {
    // State
    permissions,
    isNative,

    // Camera
    checkCameraPermission,
    requestCameraPermission,

    // Location
    checkLocationPermission,
    requestLocationPermission,
    getCurrentLocation,

    // Notifications
    checkNotificationPermission,
    requestNotificationPermission,

    // Utilities
    checkAllPermissions,
    openAppSettings,
    getPermissionStatusMessage,
  };
}
