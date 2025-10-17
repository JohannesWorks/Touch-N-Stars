import { defineStore } from 'pinia';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { ref } from 'vue';
import { timeSync } from '@/utils/timeSync';
import { usePermissions } from '@/composables/usePermissions';

export const useCameraStore = defineStore('cameraStore', () => {
  const framingStore = useFramingStore();
  const store = apiStore();
  const { checkCameraPermission, requestCameraPermission, isNative } = usePermissions();

  const remainingExposureTime = ref(0);
  const progress = ref(0);
  const imageData = ref(null);
  const loading = ref(false);
  const isExposure = ref(false);
  const isLoadingImage = ref(false);
  const isLooping = ref(false);
  const isAbort = ref(false);
  const showInfo = ref(false);
  const coolingTemp = ref(-10);
  const coolingTime = ref(10);
  const warmingTime = ref(10);
  const buttonCoolerOn = ref(false);
  const buttonWarmingOn = ref(false);
  const plateSolveError = ref(false);
  const plateSolveResult = ref('');
  const exposureCountdown = ref(0);
  const exposureProgress = ref(0);
  const countdownRunning = ref(false);
  const binningMode = ref('1x1');
  const readoutMode = ref(0);
  const containerSize = ref(100);
  const slewModal = ref(false);
  const showCameraInfo = ref(false); // eslint-disable-line no-unused-vars
  const cameraPermissionDenied = ref(false);

  let exposureCountdownTimer = null;

  // Hilfsfunktion, um kurz zu warten
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Startet den Belichtungs-Countdown
  function startExposureCountdown(totalTime) {
    // Hier gleich Promise zurückgeben, damit wir drauf warten können
    return new Promise((resolve, reject) => {
      exposureCountdownTimer = setInterval(() => {
        // Abbruch?
        if (!isExposure.value) {
          clearInterval(exposureCountdownTimer);
          reject(new Error('Belichtung wurde abgebrochen.'));
          return;
        }

        remainingExposureTime.value--;
        progress.value = ((totalTime - remainingExposureTime.value) / totalTime) * 100;

        if (remainingExposureTime.value <= 0) {
          clearInterval(exposureCountdownTimer);
          progress.value = 100;
          resolve(); // Countdown fertig
        }
      }, 1000);
    });
  }

  // Startet die Aufnahme + Countdown + Bildabruf
  async function capturePhoto(apiService, exposureTime, gain, solve = false) {
    // Camera Permission Check (only on native platforms)
    if (isNative) {
      try {
        const permissionResult = await requestCameraPermission();

        if (!permissionResult.granted) {
          console.warn('Camera permission denied');
          cameraPermissionDenied.value = true;
          return { success: false, error: 'Camera permission denied' };
        }

        cameraPermissionDenied.value = false;
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        return { success: false, error: 'Permission check failed' };
      }
    }

    if (exposureTime <= 0) {
      exposureTime = 2; // Default-Wert
      return;
    }
    loading.value = true;
    isExposure.value = true;
    isLoadingImage.value = false;
    isAbort.value = false;
    remainingExposureTime.value = exposureTime;
    progress.value = 0;
    //console.log(gain);

    try {
      // Starte Aufnahme via API
      const capturePromise = apiService.startCapture(exposureTime, gain, solve, true);

      // Countdown laufen lassen
      await startExposureCountdown(exposureTime);

      // Warte, bis API-Aufnahme fertig ist
      await capturePromise;

      // Jetzt Bild holen
      isExposure.value = false;
      isLoadingImage.value = true;
      plateSolveResult.value = null;

      let attempts = 0;
      const maxAttempts = 60;
      let image = imageData.value;
      let done = false;

      while (!done && attempts < maxAttempts && !isAbort.value) {
        try {
          const resImageData = await apiService.getImageData();

          console.log('attempts', attempts);

          if (image != imageData.value) {
            console.log('Image data received from API.');
            if (solve === false) {
              done = true;
              console.log('Image captured without plate solving.');
              break;
            }
            if (resImageData.Response != 'Capture already in progress') {
              console.log(
                'PlateSolveResult received from API.',
                resImageData?.Response?.PlateSolveResult
              );
              plateSolveResult.value = resImageData?.Response?.PlateSolveResult || null;
              done = true;
              console.log('Image captured with plate solving.');
              break;
            }
          }
        } catch (error) {
          console.error('Error fetching image:', error.message);
        }
        attempts++;
        await wait(1000);
      }

      // Wenn bis hier kein Bild und kein Abbruch
      if (!done && !isAbort.value) {
        alert('Image was not provided in time');
      }
    } catch (error) {
      console.error('Error during capture:', error.message);
    } finally {
      loading.value = false;
      isLoadingImage.value = false;
      // Dauerschleife?
      if (isLooping.value) {
        console.log('Starting next looped exposure...');
        capturePhoto(apiService, exposureTime, gain);
      }
    }
  }

  /**
   * Bricht die Belichtung ab
   */
  async function abortExposure(apiService) {
    try {
      console.log('Abbruch der Belichtung gestartet...');
      await apiService.cameraAction('abort-exposure');
      clearInterval(exposureCountdownTimer);

      isAbort.value = true;
      isExposure.value = false;
      isLoadingImage.value = false;
      isLooping.value = false;
      remainingExposureTime.value = 0;
      progress.value = 0;

      console.log('Exposure successfully aborted.');
    } catch (error) {
      console.error('Error aborting exposure:', error);
    } finally {
      loading.value = false;
    }
  }

  async function getCameraRotation(apiService, exposureTime = 2, gain) {
    // Camera Permission Check (only on native platforms)
    if (isNative) {
      try {
        const permissionResult = await requestCameraPermission();

        if (!permissionResult.granted) {
          console.warn('Camera permission denied');
          cameraPermissionDenied.value = true;
          return { success: false, error: 'Camera permission denied' };
        }

        cameraPermissionDenied.value = false;
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        return { success: false, error: 'Permission check failed' };
      }
    }

    loading.value = true;
    isLoadingImage.value = true;
    progress.value = 0;
    plateSolveError.value = false;

    try {
      // Starte Aufnahme via API
      let result; // Deklaration der Variable result
      let plateSolveResult = null;
      let plateSolveStatusCode = 0;
      isLoadingImage.value = true;
      result = await apiService.getPlatesovle(exposureTime, gain);
      console.log('result: ', result);

      plateSolveResult = result?.Response?.PlateSolveResult;
      plateSolveStatusCode = result?.StatusCode;
      if (plateSolveStatusCode != 200) {
        plateSolveError.value = true;
        console.log('plateSolveError: ', plateSolveStatusCode, plateSolveError.value);
      }
      if (plateSolveResult) {
        framingStore.rotationAngle = plateSolveResult.PositionAngle;
        console.log('Camera position angle: ', framingStore.rotationAngle);
      }
    } catch (error) {
      console.error('Error during capture:', error.message);
    } finally {
      loading.value = false;
      isLoadingImage.value = false;
    }
  }

  // Stoppt den Countdown (z.B. wenn App pausiert)
  function stopCountdown() {
    if (countdownRunning.value) {
      console.log('Stopping exposure countdown...');
      countdownRunning.value = false;
    }
  }

  //Countdown für Statusanzeige mit Server-Zeit-Synchronisation
  async function updateCountdown() {
    const exposureEndTime = store.cameraInfo.ExposureEndTime;

    if (!exposureEndTime) {
      exposureCountdown.value = 0;
      exposureProgress.value = 0;
      return;
    }

    // Stop any existing countdown loop first
    if (countdownRunning.value) {
      countdownRunning.value = false;
      // Wait a bit to ensure old loop stops
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Ensure time sync before starting countdown
    await timeSync.ensureSync();

    const endTime = new Date(exposureEndTime).getTime();
    if (isNaN(endTime)) {
      console.error('Invalid date format for ExposureEndTime.');
      exposureCountdown.value = 0;
      exposureProgress.value = 0;
      return;
    }

    // Reset progress to 0 at start
    exposureProgress.value = 0;
    countdownRunning.value = true;

    // Store initial countdown value to calculate total duration
    let initialCountdown = null;

    while (countdownRunning.value) {
      // Use server-synchronized time for accurate countdown
      const remainingTime = timeSync.calculateCountdown(exposureEndTime);

      if (remainingTime <= 0 || !store.cameraInfo.IsExposing) {
        exposureProgress.value = 100;
        exposureCountdown.value = 0;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
        exposureProgress.value = 0;
        countdownRunning.value = false;
        break;
      }

      exposureCountdown.value = remainingTime;

      // Set initial countdown on first iteration
      if (initialCountdown === null) {
        initialCountdown = remainingTime;
      }

      // Calculate progress based on countdown: 0% when countdown = initial, 100% when countdown = 0
      if (initialCountdown > 0) {
        const elapsedTime = initialCountdown - remainingTime;
        exposureProgress.value = Math.max(0, Math.min(100, (elapsedTime / initialCountdown) * 100));
      } else {
        exposureProgress.value = 0;
      }

      // Re-sync periodically during long exposures
      if (remainingTime % 30 === 0) {
        timeSync.ensureSync();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
    }
  }

  return {
    remainingExposureTime,
    progress,
    imageData,
    loading,
    isExposure,
    isLoadingImage,
    isLooping,
    isAbort,
    showInfo,
    coolingTemp,
    coolingTime,
    warmingTime,
    buttonCoolerOn,
    buttonWarmingOn,
    plateSolveError,
    plateSolveResult,
    exposureCountdown,
    exposureProgress,
    countdownRunning,
    binningMode,
    readoutMode,
    containerSize,
    slewModal,
    cameraPermissionDenied,

    // Actions
    capturePhoto,
    getCameraRotation,
    abortExposure,
    updateCountdown,
    stopCountdown,

    // Permissions
    checkCameraPermission,
    requestCameraPermission,
  };
});
