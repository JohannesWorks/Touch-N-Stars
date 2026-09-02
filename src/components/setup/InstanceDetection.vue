<template>
  <div class="space-y-4">
    <!-- Auto-Detection Section -->
    <div class="p-4 bg-gray-700 rounded-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-white">
          {{ t('components.instanceDetection.autoDetectionTitle') }}
        </h3>
        <button @click="detectInstances" :disabled="isDetecting" class="tns-btn-primary max-w-32">
          <span v-if="isDetecting" class="loader w-4 h-4"></span>
          {{
            isDetecting
              ? t('components.instanceDetection.scanningButton')
              : t('components.instanceDetection.scanButton')
          }}
        </button>
      </div>
      <!-- Detection Results -->
      <div v-if="detectionMessage" class="mb-4">
        <div :class="detectionSuccess ? 'text-green-400' : 'text-yellow-400'" class="text-sm">
          {{ detectionMessage }}
        </div>
      </div>
      <!-- No Instance Found Message -->
      <div v-if="showNoInstanceMessage" class="text-gray-400 text-sm">
        <p>
          {{ t('components.instanceDetection.noInstanceMessage') }}
        </p>
      </div>
      <div v-else-if="!supportsMdnsDiscovery" class="text-gray-400 text-sm">
        <p>
          {{ t('components.instanceDetection.mdnsAvailabilityHint') }}
        </p>
      </div>
    </div>
    <!-- Manual Configuration -->
    <div v-if="!hideManualConfig" class="space-y-4">
      <h3 class="text-lg font-medium text-white">
        {{ t('components.instanceDetection.manualConfigTitle') }}
      </h3>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">
          {{ t('components.instanceDetection.instanceNameLabel') }}
        </label>
        <input
          v-model="instanceName"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          :placeholder="t('components.instanceDetection.instanceNamePlaceholder')"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">
          {{ t('components.instanceDetection.ipLabel') }}
        </label>
        <input
          v-model="instanceIP"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          :placeholder="t('components.instanceDetection.ipPlaceholder')"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">
          {{ t('components.instanceDetection.portLabel') }}
        </label>
        <input
          v-model="instancePort"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          :placeholder="t('components.instanceDetection.portPlaceholder')"
        />
      </div>
    </div>
  </div>

  <!-- Discovery Modal -->
  <div
    v-if="showDiscoveryModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    @click.self="closeDiscoveryModal"
  >
    <div class="w-full max-w-lg rounded-xl bg-gray-800/95 p-6 shadow-2xl">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-xl font-semibold text-white">
            {{ t('components.instanceDetection.modalTitle') }}
          </h2>
          <p class="text-sm text-gray-400">
            {{ t('components.instanceDetection.modalSubtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="p-2 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-full transition-colors"
          @click="closeDiscoveryModal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M6 6l12 12M6 18L18 6"
            />
          </svg>
        </button>
      </div>

      <div class="mt-6 space-y-4 max-h-80 overflow-y-auto pr-1">
        <div v-if="modalMessage" class="flex items-center space-x-3 text-gray-300">
          <span v-if="isDetecting" class="loader w-4 h-4"></span>
          <span>{{ modalMessage }}</span>
        </div>

        <div
          v-if="discoveryError"
          class="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {{ discoveryError }}
        </div>

        <template v-if="discoveredInstances.length">
          <button
            v-for="instance in discoveredInstances"
            :key="instanceKey(instance)"
            type="button"
            :disabled="!instance.ip || !instance.port"
            @click="handleInstanceSelected(instance)"
            class="w-full rounded-lg border border-gray-700 bg-gray-700/40 px-4 py-3 text-left text-sm text-gray-100 transition"
            :class="{
              'hover:border-blue-500 hover:bg-gray-700/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40':
                instance.ip && instance.port,
              'cursor-not-allowed opacity-60': !instance.ip || !instance.port,
            }"
          >
            <div class="text-base font-semibold text-white">
              {{ instance.label }}
            </div>
            <div class="mt-1 text-sm text-gray-300">
              <span v-if="instance.ip && instance.port">
                {{ instance.ip }}:{{ instance.port }}
              </span>
              <span v-else class="text-gray-400">
                {{ t('components.instanceDetection.addressUnavailable') }}
              </span>
            </div>
            <div v-if="instance.hosts.length > 1" class="mt-2 text-xs text-gray-500">
              {{ t('components.instanceDetection.otherAddresses') }} {{ otherHosts(instance) }}
            </div>
          </button>
        </template>

        <div
          v-else-if="!isDetecting && !discoveryError"
          class="rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm text-gray-300"
        >
          {{ t('components.instanceDetection.modalEmpty') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { mDNS } from '@acovanconis/capacitor-mdns';
import { useI18n } from 'vue-i18n';
import { resolvePinsEndpoint } from '@/services/rigEndpointResolver';

const MDNS_SERVICE_TYPES = ['_touchnstars._tcp', '_pinsdaemon._tcp'];
const PINS_DAEMON_SERVICE_TYPE = '_pinsdaemon._tcp';
const MDNS_INSTANCE_PREFIX = 'touchnstars_';
const MDNS_DISCOVERY_TIMEOUT = 6000;

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      name: '',
      ip: '',
      port: 5000,
    }),
  },
  hideManualConfig: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const instanceName = ref(props.modelValue.name);
const instanceIP = ref(props.modelValue.ip);
const instancePort = ref(props.modelValue.port);
const instanceRigId = ref(props.modelValue.rigId || '');
const instanceCandidateHosts = ref(props.modelValue.candidateHosts || []);

const isDetecting = ref(false);
const detectionMessage = ref('');
const detectionSuccess = ref(false);
const showNoInstanceMessage = ref(false);

const showDiscoveryModal = ref(false);
const discoveredInstances = ref([]);
const modalMessage = ref('');
const discoveryError = ref('');

const platform = Capacitor.getPlatform();
const supportsMdnsDiscovery =
  Capacitor.isNativePlatform() && (platform === 'android' || platform === 'ios');

watch([instanceName, instanceIP, instancePort, instanceRigId, instanceCandidateHosts], () => {
  emit('update:modelValue', {
    name: instanceName.value,
    ip: instanceIP.value,
    port: instancePort.value,
    rigId: instanceRigId.value,
    candidateHosts: instanceCandidateHosts.value,
  });
});

function instanceKey(instance) {
  return `${instance.label}|${instance.ip}|${instance.port}|${instance.instanceId || ''}`;
}

function otherHosts(instance) {
  if (!Array.isArray(instance.hosts)) {
    return '';
  }
  const unique = Array.from(
    new Set(
      instance.hosts.filter((host) => typeof host === 'string' && host && host !== instance.ip)
    )
  );
  return unique.length
    ? unique.join(', ')
    : t('components.instanceDetection.otherAddressesFallback');
}

function closeDiscoveryModal() {
  showDiscoveryModal.value = false;
}

async function handleInstanceSelected(instance) {
  if (!instance.ip || !instance.port) {
    return;
  }
  instanceName.value = instance.label;
  instanceIP.value = instance.ip;
  instancePort.value = instance.port;
  const hosts = Array.from(new Set([instance.ip, ...(instance.hosts || [])].filter(Boolean)));
  instanceCandidateHosts.value = hosts;
  // The rigId is what later stops the connection supervisor from promoting a
  // different rig's address onto this instance, so it is worth getting right
  // here. Probe every address of the find, not just the displayed one - they all
  // come from the SAME mDNS service, so racing them cannot pick a foreign rig.
  // A PINS rig also announces _touchnstars._tcp (NINA runs on it), so the probe
  // must not be limited to the pinsdaemon service type.
  try {
    const result = await resolvePinsEndpoint({
      candidates: hosts.map((host) => ({ host, source: 'discovery' })),
    });
    instanceRigId.value = result.health.rigId;
  } catch (error) {
    // Expected for a plain NINA/WPF instance: it has no pinsdaemon.
    console.warn('PINS identity probe failed:', error?.message || error);
  }
  detectionSuccess.value = true;
  detectionMessage.value = t('components.instanceDetection.selectionSuccess', {
    label: instance.label,
    ip: instance.ip,
    port: instance.port,
  });
  showNoInstanceMessage.value = false;
  closeDiscoveryModal();
}

async function detectInstances() {
  if (isDetecting.value) {
    return;
  }

  detectionSuccess.value = false;
  showNoInstanceMessage.value = false;
  discoveryError.value = '';
  modalMessage.value = '';

  if (!supportsMdnsDiscovery) {
    detectionMessage.value = t('components.instanceDetection.mdnsRequired');
    showNoInstanceMessage.value = true;
    return;
  }

  showDiscoveryModal.value = true;
  discoveredInstances.value = [];
  modalMessage.value = t('components.instanceDetection.discoveringMessage');
  detectionMessage.value = t('components.instanceDetection.scanningMessage');

  isDetecting.value = true;

  const found = await discoverViaMdns();

  if (!found && !discoveryError.value) {
    detectionMessage.value = t('components.instanceDetection.noFoundMessage');
    showNoInstanceMessage.value = true;
  }

  if (discoveryError.value) {
    showNoInstanceMessage.value = false;
  }

  isDetecting.value = false;
}

async function discoverViaMdns() {
  const collected = [];
  const failures = [];
  let anyScanSucceeded = false;

  // The native mDNS plugin keeps a single discovery listener, so parallel
  // discover() calls cancel each other. Scan one service type at a time.
  for (const type of MDNS_SERVICE_TYPES) {
    let result;
    try {
      result = await mDNS.discover({
        type,
        timeout: MDNS_DISCOVERY_TIMEOUT,
      });
    } catch (error) {
      console.error(`mDNS discovery failed for ${type}:`, error);
      failures.push(error?.message);
      continue;
    }

    if (result?.error) {
      failures.push(result.errorMessage);
      continue;
    }

    anyScanSucceeded = true;
    collected.push(
      ...(result.services || []).map((service) => normalizeMdnsService(service, type))
    );

    // Render what we have so far so the first service type shows up right away
    // while the remaining scans are still running.
    applyDiscoveryResults(collected);
  }

  if (!anyScanSucceeded) {
    const message = enhanceDiscoveryError(failures[0]);
    discoveryError.value = message;
    modalMessage.value = message;
    detectionMessage.value = t('components.instanceDetection.discoveryFailedStatus', {
      message,
    });
    return false;
  }

  const count = applyDiscoveryResults(collected);

  if (count === 0) {
    modalMessage.value = t('components.instanceDetection.modalEmpty');
    return false;
  }

  modalMessage.value = '';
  detectionMessage.value =
    count === 1
      ? t('components.instanceDetection.foundSingle')
      : t('components.instanceDetection.foundMultiple', { count });
  detectionSuccess.value = true;
  return true;
}

function applyDiscoveryResults(services) {
  const normalized = dedupeServices(services).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
  discoveredInstances.value = normalized;
  return normalized.length;
}

function normalizeMdnsService(service, sourceType) {
  const txt = service?.txt || {};
  const { baseName, suffix } = splitInstanceName(service?.name ?? '');
  const ipFromTxt = typeof txt.ip === 'string' ? txt.ip.trim() : '';
  const ipFromHosts = pickPreferredHost(service?.hosts || []);
  const ip = ipFromTxt || ipFromHosts || '';
  const port =
    sourceType === PINS_DAEMON_SERVICE_TYPE
      ? resolvePort(txt.backendPort, 5000)
      : resolvePort(txt.port, service?.port);
  const preferredName =
    (typeof txt.instanceName === 'string' && txt.instanceName.trim()) ||
    baseName ||
    service?.name ||
    '';
  const label = stripInstancePrefix(preferredName);
  const instanceId = (typeof txt.instanceId === 'string' && txt.instanceId.trim()) || suffix || '';
  const rawName = service?.name || preferredName;

  return {
    label,
    ip,
    port,
    instanceId,
    hosts: service?.hosts || [],
    txt,
    rawName,
    sourceType,
  };
}

function splitInstanceName(name) {
  if (typeof name !== 'string') {
    return { baseName: '', suffix: '' };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { baseName: '', suffix: '' };
  }

  const suffixMatch = trimmed.match(/-([0-9a-fA-F]{6})$/);
  const suffix = suffixMatch ? suffixMatch[1] : '';
  const baseWithoutSuffix = suffixMatch
    ? trimmed.slice(0, trimmed.length - suffix.length - 1).trim()
    : trimmed;

  return { baseName: stripInstancePrefix(baseWithoutSuffix), suffix };
}

function stripInstancePrefix(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const prefix = MDNS_INSTANCE_PREFIX;
  const lower = trimmed.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  if (lower.startsWith(lowerPrefix)) {
    return trimmed.slice(prefix.length);
  }
  return trimmed;
}

function pickPreferredHost(hosts) {
  if (!Array.isArray(hosts)) {
    return '';
  }
  const ipv4 = hosts.find((host) => typeof host === 'string' && host.includes('.'));
  const firstHost = hosts.find((host) => typeof host === 'string');
  return ipv4 || firstHost || '';
}

function resolvePort(txtPort, fallbackPort) {
  if (typeof txtPort === 'number' && Number.isFinite(txtPort)) {
    return txtPort;
  }
  if (typeof txtPort === 'string') {
    const parsed = parseInt(txtPort, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (typeof fallbackPort === 'number' && Number.isFinite(fallbackPort)) {
    return fallbackPort;
  }
  return 0;
}

function dedupeServices(services) {
  const unique = new Map();
  for (const service of services) {
    if (!service.ip || !service.port) {
      continue;
    }
    const key = `${service.instanceId || service.rawName}|${service.ip}|${service.port}`;
    if (!unique.has(key)) {
      unique.set(key, service);
    }
  }
  return Array.from(unique.values());
}

function enhanceDiscoveryError(rawMessage) {
  const message = (rawMessage || t('components.instanceDetection.discoveryFailedBase')).trim();
  const lowered = message.toLowerCase();
  if (
    lowered.includes('permission') ||
    lowered.includes('unauthorized') ||
    rawMessage?.includes('NEARBY_WIFI_DEVICES')
  ) {
    return t('components.instanceDetection.discoveryPermissionHintWrapper', { message });
  }
  return message;
}
</script>
<style scoped>
.loader {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
