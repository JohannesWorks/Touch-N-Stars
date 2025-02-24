<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <div v-if="!isConnected" class="text-gray-600">
        {{ $t('components.tppa.not_available') }}
      </div>
      <div v-else>
        <h5 class="text-xl text-center font-bold text-white mb-4">
          {{ $t('components.tppa.title') }}
        </h5>
        <div v-if="!store.cameraInfo.Connected">
          <p class="text-red-800">{{ $t('components.tppa.camera_mount_required') }}</p>
        </div>
        <div v-else class="flex space-x-4">
          <button
            class="default-button-cyan disabled:opacity-50"
            @click="startAlignment"
            :disabled="tppaStore.isTppaRunning"
          >
            {{
              tppaStore.isTppaRunning
                ? $t('components.tppa.running')
                : $t('components.tppa.start_alignment')
            }}
          </button>
          <button class="default-button-cyan" @click="stopAlignment">
            {{ $t('components.tppa.stop_alignment') }}
          </button>
        </div>
        <div v-if="tppaStore.currentMessage" class="mt-10">
          <div class="space-y-4">
            <div class="flex space-x-4">
              <p class="w-52">
                <strong>{{ $t('components.tppa.altitude_error') }}</strong>
              </p>
              <p>{{ showAltitudeError }}</p>
              <div v-if="showAltitudeError">
                <div
                  v-if="altitudeCorDirectionTop && !isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowUpIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.up') }}</p>
                </div>
                <div
                  v-if="!altitudeCorDirectionTop && !isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowDownIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.down') }}</p>
                </div>
                <div
                  v-if="!altitudeCorDirectionTop && isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowUpIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.up') }}</p>
                </div>
                <div
                  v-if="altitudeCorDirectionTop && isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowDownIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.down') }}</p>
                </div>
              </div>
            </div>
            <div class="flex space-x-4">
              <p class="w-52">
                <strong>{{ $t('components.tppa.azimuth_error') }}</strong>
              </p>
              <p>{{ showAzimuthError }}</p>
              <div v-if="showAzimuthError">
                <div
                  v-if="azimuthCorDirectionLeft && !isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowLeftIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.west') }}</p>
                </div>
                <div
                  v-if="!azimuthCorDirectionLeft && !isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowRightIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.east') }}</p>
                </div>
                <div
                  v-if="!azimuthCorDirectionLeft && isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowRightIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.west') }}</p>
                </div>
                <div
                  v-if="azimuthCorDirectionLeft && isSouthernHemisphere"
                  class="flex flex-row space-x-2"
                >
                  <ArrowLeftIcon class="size-6 text-blue-500" />
                  <p>{{ $t('components.tppa.east') }}</p>
                </div>
              </div>
            </div>
            <div class="flex space-x-4">
              <p class="w-52">
                <strong>{{ $t('components.tppa.total_error') }}</strong>
              </p>
              <p>{{ showTotalError }}</p>
              <!-- Smiley Display -->
              <span v-if="showTotalError">
                <span v-if="isWithinTolerance">
                  <!-- Happy SVG -->
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-6 w-6 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 23.25C18.2132 23.25 23.25 18.2132 23.25 12C23.25 5.7868 18.2132 0.75 12 0.75C5.7868 0.75 0.75 5.7868 0.75 12C0.75 18.2132 5.7868 23.25 12 23.25Z"
                      stroke="#71717A"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M11.9982 18.7542C13.2563 18.7542 14.4893 18.4027 15.5583 17.7394C16.6202 17.0804 17.4782 16.1399 18.0371 15.0224L5.94824 15C6.50681 16.1273 7.3692 17.076 8.43818 17.7394C9.50715 18.4027 10.7402 18.7542 11.9982 18.7542Z"
                      stroke="#71717A"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M18.75 10.5005C18.595 10.0617 18.3077 9.68178 17.9278 9.41305C17.5478 9.14432 17.0939 9.00001 16.6285 9.00001C16.1631 9.00001 15.7092 9.14432 15.3292 9.41305C14.9572 9.67617 14.6741 10.0459 14.5169 10.4731"
                      stroke="#71717A"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M5.25004 10.5005C5.40506 10.0617 5.69233 9.68178 6.07228 9.41305C6.45223 9.14432 6.90616 9.00001 7.37154 9.00001C7.83692 9.00001 8.29085 9.14432 8.6708 9.41305C9.04416 9.67713 9.32804 10.0486 9.48486 10.4778"
                      stroke="#71717A"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span v-else>
                  <!-- Sad SVG -->
                  <svg
                    viewBox="0 0 256 256"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-6 w-6 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="128" cy="128" r="100" stroke="currentColor" />
                    <path d="M160 160c-10-10-20-15-32-15s-22 5-32 15" stroke="currentColor" />
                    <path d="M96 96h0" stroke="currentColor" />
                    <path d="M160 96h0" stroke="currentColor" />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="tppaStore.isTppaRunning" class="bg-gray-800 p-5 m-5 border border-gray-500 rounded-md">
    <TppaLastStatus class="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import websocketService from '@/services/websocketTppa';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import { apiStore } from '@/store/store';
import { useTppaStore } from '@/store/tppaStore';
import apiService from '@/services/apiService';
import TppaLastStatus from '@/components/tppa/TppaLastStatus.vue';

const tppaStore = useTppaStore();
const store = apiStore();
const startStop = ref(false);
const isConnected = ref(false);
const showAzimuthError = ref('');
const showAltitudeError = ref('');
const showTotalError = ref('');
const azimuthCorDirectionLeft = ref(false);
const altitudeCorDirectionTop = ref(false);
const isSouthernHemisphere = ref(false);

// Tolerance in arc minutes
const tolerance = 1;

// Convert arc minutes to degrees
const toleranceInDegrees = tolerance / 60;

const isWithinTolerance = computed(() => {
  if (!showTotalError.value) return false;

  // Extract the numerical value from the DMS string
  const totalErrorDMS = showTotalError.value;
  const totalErrorValue = convertDMSToDecimal(totalErrorDMS);

  // Check if the numerical value is within the tolerance
  return Math.abs(totalErrorValue) <= toleranceInDegrees;
});

function decimalToDMS(value) {
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let degrees = Math.floor(absValue);
  let minutesDecimal = (absValue - degrees) * 60;
  let minutes = Math.floor(minutesDecimal);
  let seconds = Math.round((minutesDecimal - minutes) * 60);

  if (seconds === 60) {
    seconds = 0;
    minutes++;
  }

  if (minutes === 60) {
    minutes = 0;
    degrees++;
  }

  const degreesStr = degrees.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  const sign = isNegative ? '-' : '';
  return `${sign}${degreesStr}° ${minutesStr}' ${secondsStr}''`;
}

//function to conver DMS to Decimal
function convertDMSToDecimal(dms) {
  // Remove degree, minute, and second symbols, and split the string
  const parts = dms.replace(/[°'"]/g, '').split(' ');

  const degrees = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);

  let decimal = degrees + minutes / 60 + seconds / 3600;

  return decimal;
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function formatMessage(message) {
  if (typeof message.Error === 'string' && message.Error !== '') {
    return message.Error;
  }

  if (message.Response) {
    if (typeof message.Response === 'string') {
      if (message.Response === 'started procedure') {
        console.log('Start TPPA');
        return message.Response;
      }
      startStop.value = false;
      return message.Response;
    } else if (typeof message.Response === 'object') {
      startStop.value = false;
      const { AzimuthError, AltitudeError, TotalError } = message.Response;

      if (AzimuthError !== undefined && AltitudeError !== undefined && TotalError !== undefined) {
        const azimuthErrorDMS = decimalToDMS(AzimuthError);
        const altitudeErrorDMS = decimalToDMS(AltitudeError);
        const totalErrorDMS = decimalToDMS(TotalError);

        showAzimuthError.value = azimuthErrorDMS;
        showAltitudeError.value = altitudeErrorDMS;
        showTotalError.value = totalErrorDMS;

        azimuthCorDirectionLeft.value = AzimuthError > 0 ? true : false;
        altitudeCorDirectionTop.value = AltitudeError < 0 ? true : false;
        // Prüfe, ob sich der Nutzer auf der Südhalbkugel befindet
        isSouthernHemisphere.value = store.profileInfo.AstrometrySettings.Latitude < 0;
      } else {
        return t('components.tppa.error_values_missing');
      }
    } else {
      return t('components.tppa.unknown_response_format');
    }
  } else {
    return JSON.stringify(message, null, 2);
  }
}

async function startAlignment() {
  await unparkMount();
  websocketService.sendMessage('start-alignment');
}

function resetErrors() {
  showAzimuthError.value = '';
  showAltitudeError.value = '';
  showTotalError.value = '';
  azimuthCorDirectionLeft.value = false;
  altitudeCorDirectionTop.value = false;
}

function stopAlignment() {
  console.log("Sende 'stop-alignment' an den Server");
  websocketService.sendMessage('stop-alignment');
  resetErrors();
}

async function unparkMount() {
  if (store.mountInfo.AtPark) {
    try {
      await apiService.mountAction('unpark');
      await wait(2000);
      console.log(t('components.mount.control.unpark'));
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

onMounted(() => {
  tppaStore.initialize();

  websocketService.setStatusCallback((status) => {
    console.log('status updated:', status);
    isConnected.value = status === 'Verbunden';
    tppaStore.isConnected = isConnected.value;
  });

  websocketService.setMessageCallback((message) => {
    console.log('New message received:', message);
    const newMessage = {
      message: message,
      time: getCurrentTime(),
    };

    // Create new object to force reactivity
    tppaStore.currentMessage = JSON.parse(JSON.stringify(newMessage));

    // Update running state based on message
    if (message.Response != 'stopped procedure') {
      tppaStore.setRunning(true);
      startStop.value = true;
      console.log('TPPA start');
    } else if (message.Response === 'stopped procedure') {
      tppaStore.setRunning(false);
      startStop.value = false;
      resetErrors();
    }
    formatMessage(message);
  });

  websocketService.connect();
});

onBeforeUnmount(() => {
  websocketService.setStatusCallback(null);
  websocketService.setMessageCallback(null);
});
</script>

<style scoped></style>
