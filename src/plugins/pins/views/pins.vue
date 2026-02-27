<template>
  <div class="container py-8 sm:py-16 flex items-center justify-center px-4">
    <div class="container max-w-4xl p-0 sm:p-4 w-full">
      <h5
        class="text-2xl text-center font-bold text-white mb-6 flex items-center justify-center gap-3"
      >
        <span>{{ $t('plugins.pins.title') }}</span>
      </h5>

      <!-- Control Panel -->
      <div v-if="store.isPINS" class="flex flex-col space-y-6 animate-fade-in-up">
        <!-- Samba Share Card -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
        >
          <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
            <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </div>
          <div class="relative z-10">
            <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.sambaTitle') }}</h3>
            <p class="text-gray-400 text-sm">{{ $t('plugins.pins.sambaDescription') }}</p>
          </div>
          <div class="relative z-10">
            <toggleButton
              :status-value="sambaEnabled"
              @update:status-value="handleSambaToggle"
              :disabled="status === 'Running'"
            />
          </div>
        </div>

        <!-- PHD2 Autostart Card -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
        >
          <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
            <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div class="relative z-10">
            <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.phd2Title') }}</h3>
            <p class="text-gray-400 text-sm">
              {{ phd2Running ? $t('plugins.pins.phd2Running') : $t('plugins.pins.phd2Stopped') }}
            </p>
          </div>
          <div class="relative z-10">
            <toggleButton
              :status-value="phd2Enabled"
              @update:status-value="handlePhd2Toggle"
              :disabled="status === 'Running'"
            />
          </div>
        </div>

        <!-- WiFi Configuration Card -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-col gap-4"
        >
          <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
            <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>

          <!-- Header and Toggle -->
          <div class="flex flex-row items-center justify-between w-full relative z-10">
            <div>
              <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.wifiTitle') }}</h3>
              <p class="text-gray-400 text-sm">{{ $t('plugins.pins.stationaryDescription') }}</p>
            </div>
            <div class="flex items-center gap-4">
              <button
                v-if="stationaryMode"
                @click="scanWifi"
                class="text-blue-400 hover:text-white transition-colors p-2"
                :disabled="isScanning"
                :title="$t('plugins.pins.rescan')"
              >
                <svg
                  class="w-5 h-5"
                  :class="{ 'animate-spin': isScanning }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <toggleButton
                :status-value="stationaryMode"
                @update:status-value="handleStationaryToggle"
                :disabled="status === 'Running'"
              />
            </div>
          </div>

          <!-- Wifi Controls -->
          <div
            v-if="stationaryMode"
            class="w-full relative z-10 flex flex-col gap-3 mt-2 animate-fade-in-up"
          >
            <div
              v-if="isScanning"
              class="flex items-center gap-2 text-blue-400 py-4 justify-center"
            >
              <svg
                class="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ $t('plugins.pins.scanning') }}</span>
            </div>

            <div v-else-if="wifiList.length > 0" class="flex flex-col gap-4">
              <!-- Network Select -->
              <div class="flex flex-col gap-2">
                <label class="text-gray-400 text-xs uppercase font-bold">{{
                  $t('plugins.pins.wifiSelect')
                }}</label>
                <select
                  v-model="selectedSsid"
                  class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
                >
                  <option value="" disabled>{{ $t('plugins.pins.wifiSelect') }}</option>
                  <option v-for="net in wifiList" :key="net.ssid" :value="net.ssid">
                    {{ net.ssid }} ({{ net.quality }}) {{ net.encrypted ? '🔒' : '' }}
                  </option>
                </select>
              </div>

              <!-- Band Selection -->
              <div class="flex flex-col gap-2" v-if="selectedSsid">
                <label class="text-gray-400 text-xs uppercase font-bold">{{
                  $t('plugins.pins.wifiBand')
                }}</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="auto"
                      v-model="selectedBand"
                      class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span class="text-white text-sm">{{ $t('plugins.pins.bandAuto') }}</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="2.4GHz"
                      v-model="selectedBand"
                      class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span class="text-white text-sm">{{ $t('plugins.pins.band24') }}</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="5GHz"
                      v-model="selectedBand"
                      class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span class="text-white text-sm">{{ $t('plugins.pins.band5') }}</span>
                  </label>
                </div>
              </div>

              <!-- Password Input -->
              <div class="flex flex-col gap-2" v-if="selectedSsid">
                <label class="text-gray-400 text-xs uppercase font-bold">{{
                  $t('plugins.pins.wifiPassword')
                }}</label>
                <input
                  v-model="wifiPassword"
                  type="password"
                  class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
                  placeholder="********"
                />
              </div>

              <!-- Auto Connect Checkbox -->
              <div v-if="selectedSsid" class="flex flex-row items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  v-model="autoConnect"
                  id="autoConnect"
                  class="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label for="autoConnect" class="text-white text-sm cursor-pointer select-none">
                  {{ $t('plugins.pins.autoConnect') }}
                </label>
              </div>

              <!-- Connect Button (Placeholder connection) -->
              <button
                v-if="selectedSsid"
                class="mt-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                @click="connectWifi"
              >
                {{ $t('plugins.pins.wifiConnect') }}
              </button>
            </div>

            <div v-else class="text-gray-400 italic py-4 text-center">
              {{ $t('plugins.pins.noNetworks') }}
            </div>
          </div>
        </div>

        <!-- System Time Card -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
        >
          <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
            <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="relative z-10">
            <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.systemTime') }}</h3>
            <p class="text-gray-400 text-sm" v-if="deviceTime">
              {{ $t('plugins.pins.deviceTime') }}: {{ new Date(deviceTime * 1000).toLocaleString() }}
            </p>
            <p class="text-gray-400 text-sm" v-else>
              {{ $t('plugins.pins.loadingTime') }}
            </p>
          </div>
          <div class="relative z-10 flex flex-col items-end gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 uppercase font-bold">{{
                $t('plugins.pins.autoSync')
              }}</span>
              <toggleButton
                :status-value="pinsStore.timeSyncEnabled"
                @update:status-value="handleTimeSyncToggle"
                :disabled="status === 'Running'"
              />
            </div>
            <button
              @click="manualTimeSync"
              class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
              :disabled="status === 'Running'"
            >
              {{ $t('plugins.pins.syncNow') }}
            </button>
          </div>
        </div>

        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden"
        >
          <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <!-- Dry Run Checkbox -->
              <label
                class="flex items-center space-x-3 cursor-pointer bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-600 hover:border-blue-500/50 hover:bg-gray-800 transition-all w-full sm:w-auto justify-center sm:justify-start group"
              >
                <input
                  type="checkbox"
                  v-model="dryRun"
                  class="w-5 h-5 rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer disabled:opacity-50"
                  :disabled="status === 'Running'"
                />
                <span class="text-gray-200 font-medium group-hover:text-white transition-colors">{{
                  $t('plugins.pins.dryRun')
                }}</span>
              </label>

              <!-- Status Badge -->
              <div
                class="px-5 py-2 rounded-full font-bold text-sm border shadow-sm w-full sm:w-auto text-center"
                :class="{
                  'bg-gray-700 border-gray-600 text-gray-300': status === 'Idle',
                  'bg-blue-900/40 border-blue-500/50 text-blue-300 animate-pulse':
                    status === 'Running',
                  'bg-green-900/40 border-green-500/50 text-green-300': status === 'Success',
                  'bg-red-900/40 border-red-500/50 text-red-300': status === 'Failed',
                }"
              >
                <span
                  v-if="status === 'Running'"
                  class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 animate-ping"
                ></span>
                {{ $t('plugins.pins.status.' + status.toLowerCase()) }}
              </div>
            </div>

            <!-- Start Button -->
            <button
              @click="startUpgrade"
              :disabled="status === 'Running'"
              class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full md:w-auto flex items-center justify-center gap-2"
            >
              <svg
                v-if="status === 'Running'"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{
                status === 'Running' && activeOperation === 'upgrade'
                  ? $t('plugins.pins.upgrading')
                  : $t('plugins.pins.startUpgrade')
              }}</span>
            </button>
          </div>
        </div>

        <!-- Terminal View -->
        <div
          class="border border-gray-700 rounded-lg bg-black overflow-hidden shadow-2xl flex flex-col h-[500px]"
        >
          <div
            class="bg-gray-900 px-4 py-2 border-b border-gray-700 flex justify-between items-center"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span class="text-xs text-gray-400 font-mono font-semibold tracking-wide">{{
                $t('plugins.pins.terminalOutput')
              }}</span>
            </div>
            <button
              @click="clearLogs"
              class="text-xs text-blue-400 hover:text-white transition-colors hover:underline px-2 py-1 rounded"
            >
              {{ $t('plugins.pins.clearOutput') }}
            </button>
          </div>
          <div
            ref="terminalRef"
            class="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-1 scroll-smooth bg-black"
          >
            <div v-if="logs.length === 0" class="text-gray-600 italic select-none opacity-50">
              {{ $t('plugins.pins.waiting') }}
            </div>
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="break-words whitespace-pre-wrap font-mono leading-relaxed"
              :class="getLogClass(log)"
            >
              <span class="text-gray-600 select-none mr-2 text-[10px] align-middle">{{
                new Date().toLocaleTimeString([], { hour12: false })
              }}</span>
              <span class="mr-2 opacity-75">➜</span>
              <span v-html="formatLog(log)"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Unavailable State -->
      <div
        v-else
        class="border border-red-900/50 bg-red-900/20 rounded-lg p-8 text-center animate-fade-in-up"
      >
        <svg
          class="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="text-xl font-bold text-red-400 mb-2">{{ $t('plugins.pins.title') }}</h3>
        <p class="text-gray-400">{{ $t('plugins.pins.notAvailable') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { usePinsStore } from '../store/pinsStore';
import { apiStore } from '@/store/store';
import axios from 'axios';
import toggleButton from '@/components/helpers/toggleButton.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const pinsStore = usePinsStore();

const dryRun = ref(false);
const deviceTime = ref(null);
const sambaEnabled = ref(false);
const phd2Enabled = ref(false);
const phd2Running = ref(false);
const activeOperation = ref(null);
const stationaryMode = ref(false);
const wifiList = ref([]);
const selectedSsid = ref('');
const wifiPassword = ref('');
const selectedBand = ref('auto');
const autoConnect = ref(false);
const isScanning = ref(false);
const status = ref('Idle');
const logs = ref([]);
const terminalRef = ref(null);
const jobId = ref(null);
let ws = null;

const PORT = 8000;
const TOKEN = 'zZDqJ3IKeFaIZqG2JIFvsxzA5E48GC2gyGVagHFZqC0OMtgoupUDZCPhQDYKm35d';

watch(selectedSsid, (newSsid) => {
  if (newSsid) {
    selectedBand.value = 'auto';
    const savedPassword = pinsStore.getPassword(newSsid);
    if (savedPassword) {
      wifiPassword.value = savedPassword;
    } else {
      wifiPassword.value = '';
    }
  }
});

function clearLogs() {
  logs.value = [];
}

function appendLog(message) {
  logs.value.push(message);
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
    }
  });
}

function getLogClass(log) {
  if (typeof log !== 'string') return 'text-gray-300';
  const lower = log.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'text-red-400';
  if (lower.includes('warn')) return 'text-yellow-400';
  if (lower.includes('success') || lower.includes('done') || lower.includes('complete'))
    return 'text-green-400';
  if (lower.includes('info')) return 'text-blue-300';
  return 'text-gray-300';
}

function formatLog(log) {
  if (typeof log === 'object') {
    try {
      return JSON.stringify(log, null, 2);
    } catch (e) {
      return String(log);
    }
  }
  return log;
}

watch(
  () => store.isPINS,
  (newValue) => {
    if (newValue) {
      checkSambaStatus();
      checkPhd2Status();
      checkSystemTime();
    }
  },
  { immediate: true }
);

async function checkSystemTime() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/system/time`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data && response.data.timestamp) {
      deviceTime.value = response.data.timestamp;

      if (pinsStore.timeSyncEnabled) {
        syncSystemTime(response.data.timestamp);
      }
    }
  } catch (error) {
    console.error('Failed to check system time:', error);
  }
}

async function syncSystemTime(remoteTimestamp, force = false) {
  const ip = getIp();
  if (!ip) return;

  const localTime = Date.now() / 1000;
  const diff = Math.abs(remoteTimestamp - localTime);

  if (diff > 5 || force) {
    if (force) {
      console.log('Forcing time sync...');
      appendLog(t('plugins.pins.logs.forcingSync'));
    } else {
      console.log(`Time difference detected: ${diff.toFixed(2)}s. Syncing...`);
      appendLog(t('plugins.pins.logs.syncingTime', { diff: diff.toFixed(1) }));
    }

    try {
      const directAxios = axios.create({ headers: {} });
      await directAxios.post(
        `http://${ip}:${PORT}/system/time`,
        {
          timestamp: localTime,
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      appendLog(t('plugins.pins.logs.timeSynced'));
      // Refresh time after sync
      setTimeout(checkSystemTime, 2000);
    } catch (error) {
      console.error('Failed to sync system time:', error);
      appendLog(t('plugins.pins.logs.error', { message: 'Time Sync Failed: ' + error.message }));
    }
  } else {
    appendLog(t('plugins.pins.logs.timeInSync', { diff: diff.toFixed(3) }));
  }
}

async function manualTimeSync() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/system/time`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      timeout: 5000,
    });
    if (response.data && response.data.timestamp) {
      syncSystemTime(response.data.timestamp, true);
    }
  } catch (e) {
    console.error(e);
    appendLog(
      t('plugins.pins.logs.error', { message: 'Failed to fetch time for sync: ' + e.message })
    );
  }
}

async function handleTimeSyncToggle(newValue) {
  pinsStore.setTimeSync(newValue);
  if (newValue) {
    checkSystemTime();
  }
}

async function checkSambaStatus() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/samba`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data && typeof response.data.enabled !== 'undefined') {
      sambaEnabled.value = response.data.enabled;
    }
  } catch (error) {
    console.error('Failed to check Samba status:', error);
  }
}

async function checkPhd2Status() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/phd2`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data) {
      if (typeof response.data.enabled !== 'undefined') {
        phd2Enabled.value = response.data.enabled;
      }
      if (typeof response.data.running !== 'undefined') {
        phd2Running.value = response.data.running;
      }
    }
  } catch (error) {
    console.error('Failed to check PHD2 status:', error);
  }
}

async function handlePhd2Toggle(newValue) {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  // Update logic: Set specific operation
  status.value = 'Running';
  activeOperation.value = 'phd2';
  logs.value = [];

  phd2Enabled.value = newValue; // Optimistic update
  appendLog(t('plugins.pins.logs.init', { ip }));
  const actionKey = newValue ? 'plugins.pins.logs.phd2Enabling' : 'plugins.pins.logs.phd2Disabling';
  appendLog(
    t('plugins.pins.logs.phd2Action', {
      action: t(actionKey),
    })
  );

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/phd2`,
      { enable: newValue },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // Increased timeout for systemctl
      }
    );

    // Check for Job ID pattern just in case
    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(t('plugins.pins.logs.phd2Success'));
      status.value = 'Success';

      // Update running state immediately if successful
      if (newValue) {
        phd2Running.value = true;
      } else {
        phd2Running.value = false;
      }

      // Double check status after delay
      setTimeout(checkPhd2Status, 2000);
    }
  } catch (error) {
    status.value = 'Failed';
    phd2Enabled.value = !newValue; // Revert
    console.error(error);
    appendLog(t('plugins.pins.logs.phd2Failed', { message: error.message }));

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  }
}

// Function to get the current connection IP
function getIp() {
  return settingsStore.connection.ip || window.location.hostname;
}

async function handleStationaryToggle(newValue) {
  if (status.value === 'Running') return;
  stationaryMode.value = newValue;
  if (newValue) {
    scanWifi();
  } else {
    wifiList.value = [];
    selectedSsid.value = '';
    wifiPassword.value = '';
  }
}

async function scanWifi() {
  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  isScanning.value = true;
  wifiList.value = [];

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/wifi/scan`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 15000,
    });

    let networks = response.data || [];
    // Deduplicate by SSID and filter empty SSIDs
    const seen = new Set();
    wifiList.value = networks
      .filter((n) => {
        if (!n.ssid) return false;
        if (seen.has(n.ssid)) return false;
        seen.add(n.ssid);
        return true;
      })
      .sort((a, b) => b.signal_strength - a.signal_strength);
  } catch (error) {
    console.error(error);
    appendLog(t('plugins.pins.logs.error', { message: 'Wifi Scan Failed: ' + error.message }));
  } finally {
    isScanning.value = false;
  }
}

async function connectWifi() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  status.value = 'Running';
  activeOperation.value = 'wifi';
  logs.value = [];
  appendLog(t('plugins.pins.logs.init', { ip }));
  appendLog(t('plugins.pins.logs.connectingToWifi', { ssid: selectedSsid.value }));

  // Save password to store
  if (selectedSsid.value && wifiPassword.value) {
    pinsStore.savePassword(selectedSsid.value, wifiPassword.value);
  }

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/wifi/connect`,
      {
        ssid: selectedSsid.value,
        password: wifiPassword.value,
        auto_connect: autoConnect.value,
        band: selectedBand.value === 'auto' ? null : selectedBand.value,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(t('plugins.pins.logs.wifiResponse', { response: JSON.stringify(data) }));
      status.value = 'Success';
    }
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(
      t('plugins.pins.logs.error', { message: 'Wifi Connection Failed: ' + error.message })
    );

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  }
}

async function handleSambaToggle(newValue) {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  sambaEnabled.value = newValue;
  status.value = 'Running';
  activeOperation.value = 'samba';
  logs.value = [];
  appendLog(t('plugins.pins.logs.init', { ip }));

  const actionKey = newValue ? 'plugins.pins.logs.sambaEnable' : 'plugins.pins.logs.sambaDisable';
  appendLog(t('plugins.pins.logs.sambaAction', { action: t(actionKey) }));

  try {
    const directAxios = axios.create({ headers: {} });

    const response = await directAxios.post(
      `http://${ip}:${PORT}/samba`,
      { enable: newValue },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (!returnedJobId) {
      throw new Error('No valid Job ID returned. server response: ' + JSON.stringify(data));
    }

    jobId.value = returnedJobId;
    appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));

    connectWebSocket(ip, returnedJobId);
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    sambaEnabled.value = !newValue; // Revert on failure
    appendLog(t('plugins.pins.logs.daemonCheck', { ip, port: PORT }));

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      appendLog(t('plugins.pins.logs.networkError'));
    } else if (error.request) {
      appendLog(t('plugins.pins.logs.noResponse'));
    } else {
      appendLog(t('plugins.pins.logs.error', { message: error.message }));
    }
  }
}

async function startUpgrade() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    status.value = 'Failed';
    return;
  }

  status.value = 'Running';
  activeOperation.value = 'upgrade';
  logs.value = [];
  appendLog(t('plugins.pins.logs.init', { ip }));
  appendLog(t('plugins.pins.logs.config', { dryRun: dryRun.value }));

  try {
    // Create a clean axios instance to avoid global interceptors
    const directAxios = axios.create({
      headers: {}, // Start with empty headers
    });

    const response = await directAxios.post(
      `http://${ip}:${PORT}/upgrade`,
      { dryRun: dryRun.value },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    // Flexible handling of job ID
    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (!returnedJobId) {
      throw new Error('No valid Job ID returned. server response: ' + JSON.stringify(data));
    }

    jobId.value = returnedJobId;
    appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));

    connectWebSocket(ip, returnedJobId);
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(t('plugins.pins.logs.daemonCheck', { ip, port: PORT }));

    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
      if (error.response.status === 405) {
        appendLog(t('plugins.pins.logs.corsHint'));
      }
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      appendLog(t('plugins.pins.logs.networkError'));
    } else if (error.request) {
      // The request was made but no response was received
      appendLog(t('plugins.pins.logs.noResponse'));
    } else {
      // Something happened in setting up the request that triggered an Error
      appendLog(t('plugins.pins.logs.error', { message: error.message }));
    }
  }
}

function connectWebSocket(ip, id) {
  if (ws) {
    ws.close();
  }

  const wsUrl = `ws://${ip}:${PORT}/logs/${id}?token=${TOKEN}`;
  appendLog(t('plugins.pins.logs.wsConnecting', { wsUrl }));

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      appendLog(t('plugins.pins.logs.wsConnected'));
    };

    ws.onmessage = (event) => {
      if (event.data) {
        appendLog(event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      appendLog(t('plugins.pins.logs.wsError'));
    };

    ws.onclose = (event) => {
      appendLog(t('plugins.pins.logs.wsClosed', { code: event.code }));
      ws = null;

      // When WS closes, we check the final status
      checkFinalStatus(ip, id);
    };
  } catch (e) {
    appendLog(t('plugins.pins.logs.wsCreationFailed', { message: e.message }));
    status.value = 'Failed';
  }
}

async function checkFinalStatus(ip, id) {
  appendLog(t('plugins.pins.logs.verifyingStatus'));
  try {
    const directAxios = axios.create();
    const response = await directAxios.get(`http://${ip}:${PORT}/jobs/${id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    const result = response.data;
    if (typeof result === 'object') {
      appendLog(t('plugins.pins.logs.jobReport', { report: JSON.stringify(result, null, 2) }));

      // Check for success indicators
      const isSuccess =
        result.status === 'success' ||
        result.status === 'completed' ||
        result.exit_code === 0 ||
        result.exitCode === 0 ||
        result.success === true;

      if (isSuccess) {
        status.value = 'Success';
        appendLog(t('plugins.pins.logs.upgradeSuccess'));
      } else {
        status.value = 'Failed';
        appendLog(t('plugins.pins.logs.upgradeFailed', { exitCode: result.exitCode ?? 'Unknown' }));
      }
    } else {
      appendLog(t('plugins.pins.logs.jobStatus', { status: result }));
      status.value = 'Idle'; // Ambiguous
    }
  } catch (e) {
    appendLog(t('plugins.pins.logs.statusFetchFailed', { message: e.message }));
    // If we can't verify, we leave it as Idle or keep last state?
    // Let's set to finish but unknown
    if (status.value === 'Running') status.value = 'Idle';
  }
}

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for terminal */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #111827;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 5px;
  border: 2px solid #111827;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
