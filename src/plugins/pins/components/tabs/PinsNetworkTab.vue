<template>
  <div class="flex flex-col space-y-6">
    <PinsWifiCard
      :stationary-mode="stationaryMode"
      :allow-concurrent-mode="allowConcurrentMode"
      :is-scanning="isScanning"
      :wifi-list="wifiList"
      :wifi-status="wifiStatus"
      :wifi-mode="wifiMode"
      :supports-network-mode="supportsNetworkMode"
      :connection-state="connectionState"
      :mobile-wifi-signal="mobileWifiSignal"
      :selected-ssid="selectedSsid"
      :wifi-password="wifiPassword"
      :selected-band="selectedBand"
      :auto-connect="autoConnect"
      :wifi-adapters="wifiAdapters"
      :interfaces-loading="interfacesLoading"
      :interfaces-saving="interfacesSaving"
      :selected-client-interface="selectedClientInterface"
      :selected-hotspot-interface="selectedHotspotInterface"
      :hotspot-configured="hotspotConfigured"
      :hotspot-password="hotspotPassword"
      :hotspot-band="hotspotBand"
      :hotspot-channel="hotspotChannel"
      :hotspot-source="hotspotSource"
      :hotspot-interface="hotspotInterface"
      :supported-channels="supportedChannels"
      :hotspot-save-result="hotspotSaveResult"
      :hotspot-can-save-with-session-password="hotspotCanSaveWithSessionPassword"
      :hotspot-loading="hotspotLoading"
      :hotspot-saving="hotspotSaving"
      :disabled="disabled"
      @toggle-stationary="$emit('toggle-stationary', $event)"
      @scan-wifi="$emit('scan-wifi')"
      @refresh-interfaces="$emit('refresh-interfaces')"
      @save-interfaces="$emit('save-interfaces')"
      @connect-wifi="$emit('connect-wifi')"
      @disconnect-wifi="$emit('disconnect-wifi')"
      @set-network-mode="$emit('set-network-mode', $event)"
      @retry-network-recovery="$emit('retry-network-recovery')"
      @update:selected-ssid="$emit('update:selected-ssid', $event)"
      @update:wifi-password="$emit('update:wifi-password', $event)"
      @update:selected-band="$emit('update:selected-band', $event)"
      @update:auto-connect="$emit('update:auto-connect', $event)"
      @update:selected-client-interface="$emit('update:selected-client-interface', $event)"
      @update:selected-hotspot-interface="$emit('update:selected-hotspot-interface', $event)"
      @update:hotspot-password="$emit('update:hotspot-password', $event)"
      @update:hotspot-band="$emit('update:hotspot-band', $event)"
      @update:hotspot-channel="$emit('update:hotspot-channel', $event)"
      @load-hotspot="$emit('load-hotspot')"
      @save-hotspot="$emit('save-hotspot')"
    />

    <PinsDhcpClientsCard
      v-if="!stationaryMode || allowConcurrentMode"
      :clients="dhcpClients"
      :loading="dhcpClientsLoading"
      @refresh="$emit('refresh-dhcp')"
    />
  </div>
</template>

<script setup>
import PinsWifiCard from '../PinsWifiCard.vue';
import PinsDhcpClientsCard from '../PinsDhcpClientsCard.vue';

defineProps({
  stationaryMode: {
    type: Boolean,
    required: true,
  },
  allowConcurrentMode: {
    type: Boolean,
    required: true,
  },
  isScanning: {
    type: Boolean,
    required: true,
  },
  wifiList: {
    type: Array,
    required: true,
  },
  wifiStatus: {
    type: Object,
    required: false,
    default: null,
  },
  wifiMode: {
    type: Object,
    required: false,
    default: null,
  },
  supportsNetworkMode: {
    type: Boolean,
    default: true,
  },
  connectionState: {
    type: Object,
    required: true,
  },
  mobileWifiSignal: {
    type: Object,
    required: false,
    default: null,
  },
  selectedSsid: {
    type: String,
    required: true,
  },
  wifiPassword: {
    type: String,
    required: true,
  },
  selectedBand: {
    type: String,
    required: true,
  },
  autoConnect: {
    type: Boolean,
    required: true,
  },
  wifiAdapters: {
    type: Array,
    required: true,
  },
  interfacesLoading: {
    type: Boolean,
    required: true,
  },
  interfacesSaving: {
    type: Boolean,
    required: true,
  },
  selectedClientInterface: {
    type: String,
    required: true,
  },
  selectedHotspotInterface: {
    type: String,
    required: true,
  },
  hotspotConfigured: {
    type: Boolean,
    required: true,
  },
  hotspotPassword: {
    type: String,
    required: true,
  },
  hotspotBand: {
    type: String,
    required: true,
  },
  hotspotChannel: {
    type: String,
    required: true,
  },
  hotspotSource: {
    type: String,
    required: true,
  },
  hotspotInterface: {
    type: String,
    required: true,
  },
  supportedChannels: {
    type: Object,
    required: true,
  },
  hotspotSaveResult: {
    type: Object,
    required: false,
    default: null,
  },
  hotspotCanSaveWithSessionPassword: {
    type: Boolean,
    required: true,
  },
  hotspotLoading: {
    type: Boolean,
    required: true,
  },
  hotspotSaving: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
  dhcpClients: {
    type: Array,
    required: true,
  },
  dhcpClientsLoading: {
    type: Boolean,
    required: true,
  },
});

defineEmits([
  'toggle-stationary',
  'scan-wifi',
  'refresh-interfaces',
  'save-interfaces',
  'connect-wifi',
  'disconnect-wifi',
  'set-network-mode',
  'retry-network-recovery',
  'update:selected-ssid',
  'update:wifi-password',
  'update:selected-band',
  'update:auto-connect',
  'update:selected-client-interface',
  'update:selected-hotspot-interface',
  'update:hotspot-password',
  'update:hotspot-band',
  'update:hotspot-channel',
  'load-hotspot',
  'save-hotspot',
  'refresh-dhcp',
]);
</script>
