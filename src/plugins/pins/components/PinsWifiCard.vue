<template>
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

    <div class="flex flex-row items-center justify-between w-full relative z-10">
      <div>
        <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.wifiTitle') }}</h3>
        <p class="text-gray-400 text-sm">{{ $t('plugins.pins.stationaryDescription') }}</p>
      </div>
      <div class="flex items-center gap-4">
        <button
          v-if="stationaryMode || allowConcurrentMode"
          @click="$emit('scan-wifi')"
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
          @update:status-value="$emit('toggle-stationary', $event)"
          :disabled="disabled"
        />
      </div>
    </div>

    <!-- Only daemons exposing /wifi/mode can switch modes or report one. -->
    <div
      v-if="supportsNetworkMode"
      class="w-full relative z-10 border border-gray-700 rounded-lg bg-gray-900/40 p-4 flex flex-col gap-3"
    >
      <div>
        <h4 class="text-base font-bold text-white">Rig network mode</h4>
        <p class="text-gray-400 text-xs">
          Automatic uses your configured Wi-Fi when available and starts the field hotspot when it
          is not. Field hotspot keeps the rig reachable at 10.42.0.1.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          class="rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50"
          :class="
            desiredNetworkMode === 'auto'
              ? 'border-blue-500 bg-blue-900/30 text-white'
              : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
          "
          :disabled="disabled || networkTransitionActive"
          @click="$emit('set-network-mode', 'auto')"
        >
          <span class="block font-semibold">Automatic fallback</span>
          <span class="block text-xs text-gray-400 mt-1"
            >Home Wi-Fi first, hotspot if unavailable</span
          >
        </button>
        <button
          class="rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50"
          :class="
            desiredNetworkMode === 'hotspot'
              ? 'border-amber-500 bg-amber-900/30 text-white'
              : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
          "
          :disabled="disabled || networkTransitionActive"
          @click="$emit('set-network-mode', 'hotspot')"
        >
          <span class="block font-semibold">Field hotspot</span>
          <span class="block text-xs text-gray-400 mt-1">Stay in AP mode at 10.42.0.1</span>
        </button>
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>Configured: {{ desiredNetworkMode }}</span>
        <span>Active: {{ observedNetworkMode }}</span>
        <span v-if="connectionState.activeHost">Endpoint: {{ connectionState.activeHost }}</span>
      </div>

      <p v-if="!allowConcurrentMode" class="text-xs text-amber-300">
        This rig has one Wi-Fi radio. Switching modes briefly disconnects this screen while the app
        finds the rig again.
      </p>

      <div
        v-if="networkTransitionActive || connectionState.phase === 'failed'"
        class="rounded-lg border p-3 text-sm"
        :class="
          connectionState.phase === 'failed'
            ? 'border-red-700 bg-red-900/20 text-red-100'
            : 'border-blue-700 bg-blue-900/20 text-blue-100'
        "
      >
        <p class="font-semibold">
          {{
            connectionState.phase === 'failed'
              ? 'The rig could not be found after the network change.'
              : 'Network changed as expected. Looking for this rig again…'
          }}
        </p>
        <p v-if="connectionState.attemptedHosts?.length" class="text-xs mt-1 break-all opacity-80">
          Tried: {{ connectionState.attemptedHosts.join(', ') }}
        </p>
        <p v-if="connectionState.error" class="text-xs mt-1 opacity-80">
          {{ connectionState.error }}
        </p>
        <button
          v-if="connectionState.phase === 'failed'"
          class="mt-3 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          @click="$emit('retry-network-recovery')"
        >
          Find rig again
        </button>
      </div>
    </div>

    <div
      class="w-full relative z-10 border border-gray-700 rounded-lg bg-gray-900/40 p-4 flex flex-col gap-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h4 class="text-base font-bold text-white">{{ $t('plugins.pins.wifiAdaptersTitle') }}</h4>
          <p class="text-gray-400 text-xs">{{ $t('plugins.pins.wifiAdaptersDescription') }}</p>
        </div>
        <button
          class="text-blue-400 hover:text-white transition-colors p-2"
          :disabled="interfacesLoading || interfacesSaving || disabled"
          :title="$t('plugins.pins.wifiAdapterRefresh')"
          @click="$emit('refresh-interfaces')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': interfacesLoading }"
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
      </div>

      <div v-if="wifiAdapters.length === 0" class="text-sm text-gray-400 italic">
        {{ $t('plugins.pins.wifiNoAdapters') }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiClientInterface')
          }}</label>
          <select
            :value="selectedClientInterface"
            @change="$emit('update:selectedClientInterface', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            :disabled="interfacesLoading || interfacesSaving || disabled"
          >
            <option value="">{{ $t('plugins.pins.wifiAutoInterface') }}</option>
            <option
              v-for="adapter in wifiAdapters"
              :key="adapter.interface"
              :value="adapter.interface"
            >
              {{ formatAdapterLabel(adapter) }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiHotspotInterface')
          }}</label>
          <select
            :value="selectedHotspotInterface"
            @change="$emit('update:selectedHotspotInterface', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            :disabled="interfacesLoading || interfacesSaving || disabled"
          >
            <option value="">{{ $t('plugins.pins.wifiAutoInterface') }}</option>
            <option
              v-for="adapter in wifiAdapters"
              :key="adapter.interface"
              :value="adapter.interface"
            >
              {{ formatAdapterLabel(adapter) }}
            </option>
          </select>
        </div>
      </div>

      <button
        class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
        :disabled="interfacesLoading || interfacesSaving || disabled"
        @click="$emit('save-interfaces')"
      >
        {{
          interfacesSaving
            ? $t('plugins.pins.wifiAdapterSaving')
            : $t('plugins.pins.wifiAdapterSave')
        }}
      </button>
    </div>

    <div
      v-if="stationaryMode || allowConcurrentMode"
      class="w-full relative z-10 flex flex-col gap-3 mt-2 animate-fade-in-up"
    >
      <div
        class="rounded-lg border p-3 text-sm"
        :class="
          wifiIsConnected
            ? 'border-emerald-700 bg-emerald-900/20 text-emerald-100'
            : 'border-gray-700 bg-gray-900/40 text-gray-300'
        "
      >
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="wifiIsConnected ? 'bg-emerald-400' : 'bg-gray-500'"
            ></span>
            <span class="font-semibold">
              {{
                wifiIsConnected
                  ? $t('plugins.pins.wifiStatusConnected')
                  : $t('plugins.pins.wifiStatusDisconnected')
              }}
            </span>
          </div>
          <div v-if="wifiIsConnected" class="text-xs text-emerald-200 sm:text-right">
            <span>{{ wifiStatusLabel }}</span>
          </div>
        </div>
      </div>

      <div v-if="wifiConnectionRows.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="connection in wifiConnectionRows"
          :key="connection.key"
          class="rounded-lg border border-gray-700 bg-gray-900/40 p-3 flex flex-col gap-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-xs uppercase font-bold text-gray-400">
                {{ formatConnectionRole(connection.role) }}
              </div>
              <div class="text-white font-semibold truncate">
                {{ connection.ssid || connection.connectionName || connection.interface || '-' }}
              </div>
            </div>
            <span
              class="text-xs px-2 py-1 rounded border"
              :class="
                connection.connected
                  ? 'border-emerald-700 bg-emerald-900/30 text-emerald-200'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              "
            >
              {{
                connection.connected
                  ? $t('plugins.pins.wifiStatusConnected')
                  : $t('plugins.pins.wifiStatusDisconnected')
              }}
            </span>
          </div>

          <div class="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
            <span v-if="connection.interface">{{ connection.interface }}</span>
            <span v-if="connection.ipAddress">{{ connection.ipAddress }}</span>
            <span v-if="connection.band">{{ connection.band }}</span>
            <span v-if="connection.channel">{{
              $t('plugins.pins.wifiChannel', { channel: connection.channel })
            }}</span>
          </div>

          <div v-if="hasSignal(connection)" class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs text-gray-300">
              <span>
                {{
                  connection.measuredOnMobile
                    ? $t('plugins.pins.wifiSignalMobile')
                    : $t('plugins.pins.wifiSignal')
                }}
              </span>
              <span>{{
                $t('plugins.pins.wifiSignalValue', { value: connection.signalStrength })
              }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="signalBarClass(connection.signalStrength)"
                :style="{ width: `${connection.signalStrength}%` }"
              ></div>
            </div>
            <div
              v-if="signalHistory(connection).length > 1"
              class="flex items-end gap-1 h-8 pt-1"
              :aria-label="$t('plugins.pins.wifiSignalHistory')"
            >
              <span
                v-for="(sample, index) in signalHistory(connection)"
                :key="`${connection.key}-${index}`"
                class="flex-1 min-w-[3px] rounded-sm"
                :class="signalBarClass(sample)"
                :style="{ height: `${Math.max(15, sample)}%` }"
              ></span>
            </div>
            <div v-if="connection.rssiDbm" class="text-[11px] text-gray-500">
              {{ $t('plugins.pins.wifiRssiValue', { value: connection.rssiDbm }) }}
            </div>
          </div>

          <div v-else class="text-xs text-gray-500">
            {{ $t('plugins.pins.wifiSignalUnavailable') }}
          </div>
        </div>
      </div>

      <div v-if="isScanning" class="flex items-center gap-2 text-blue-400 py-4 justify-center">
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
        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiSelect')
          }}</label>
          <select
            :value="selectedSsid"
            @change="$emit('update:selectedSsid', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          >
            <option value="" disabled>{{ $t('plugins.pins.wifiSelect') }}</option>
            <option v-for="net in wifiList" :key="net.ssid" :value="net.ssid">
              {{ net.ssid }} ({{ net.quality }}) {{ net.encrypted ? '🔒' : '' }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-2" v-if="selectedSsid">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiBand')
          }}</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="auto"
                :checked="selectedBand === 'auto'"
                @change="$emit('update:selectedBand', 'auto')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.bandAuto') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="2.4GHz"
                :checked="selectedBand === '2.4GHz'"
                @change="$emit('update:selectedBand', '2.4GHz')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.band24') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="5GHz"
                :checked="selectedBand === '5GHz'"
                @change="$emit('update:selectedBand', '5GHz')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.band5') }}</span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2" v-if="selectedSsid">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiPassword')
          }}</label>
          <input
            :value="wifiPassword"
            @input="$emit('update:wifiPassword', $event.target.value)"
            type="password"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            placeholder="********"
          />
        </div>

        <div v-if="selectedSsid" class="flex flex-row items-center gap-2 mt-2">
          <input
            type="checkbox"
            :checked="autoConnect"
            @change="$emit('update:autoConnect', $event.target.checked)"
            id="autoConnect"
            class="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label for="autoConnect" class="text-white text-sm cursor-pointer select-none">
            {{ $t('plugins.pins.autoConnect') }}
          </label>
        </div>

        <button
          v-if="selectedSsid"
          class="mt-2 w-full py-3 font-bold rounded-lg transition-all disabled:opacity-50"
          :class="
            isSelectedNetworkConnected
              ? 'bg-gray-700 text-gray-300 border border-emerald-700/60'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20'
          "
          :disabled="disabled || isSelectedNetworkConnected"
          @click="$emit('connect-wifi')"
        >
          {{
            isSelectedNetworkConnected
              ? $t('plugins.pins.wifiConnectedAction')
              : $t('plugins.pins.wifiConnect')
          }}
        </button>

        <button
          class="w-full py-3 font-bold rounded-lg transition-all disabled:opacity-50"
          :class="
            wifiIsConnected
              ? 'bg-gray-800 border border-red-700/70 text-red-200 hover:bg-red-900/30'
              : 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-900/20'
          "
          :disabled="disabled"
          @click="$emit('disconnect-wifi')"
        >
          {{ $t('plugins.pins.wifiDisconnect') }}
        </button>
      </div>

      <div v-else class="text-gray-400 italic py-4 text-center">
        {{ $t('plugins.pins.noNetworks') }}
      </div>
    </div>

    <div class="w-full relative z-10 border-t border-gray-700 pt-4 mt-1 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-base font-bold text-white">
            {{ $t('plugins.pins.hotspotPasswordTitle') }}
          </h4>
          <div class="text-gray-400 text-xs space-y-1">
            <p>
              {{
                hotspotConfigured
                  ? $t('plugins.pins.hotspotConfigured')
                  : $t('plugins.pins.hotspotNotConfigured')
              }}
            </p>
            <p>
              {{
                $t('plugins.pins.hotspotMetaLine', {
                  source: hotspotSource || 'default',
                  iface: hotspotInterface || 'auto',
                  band: hotspotBand === 'auto' ? 'unset' : hotspotBand,
                  channel: hotspotChannel || 'unset',
                })
              }}
            </p>
          </div>
        </div>
        <button
          class="text-blue-400 hover:text-white transition-colors p-2"
          :disabled="hotspotLoading || hotspotSaving || disabled"
          :title="$t('plugins.pins.hotspotRefresh')"
          @click="$emit('load-hotspot')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': hotspotLoading }"
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
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-gray-400 text-xs uppercase font-bold">
          {{ $t('plugins.pins.hotspotBandLabel') }}
        </label>
        <select
          :value="hotspotBand"
          @change="$emit('update:hotspotBand', $event.target.value)"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          :disabled="hotspotSaving || hotspotLoading || disabled"
        >
          <option value="auto">{{ $t('plugins.pins.hotspotBandAuto') }}</option>
          <option value="2.4GHz">{{ $t('plugins.pins.band24') }}</option>
          <option value="5GHz">{{ $t('plugins.pins.band5') }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-gray-400 text-xs uppercase font-bold">
          {{ $t('plugins.pins.hotspotChannelLabel') }}
        </label>
        <input
          :value="hotspotChannel"
          @input="$emit('update:hotspotChannel', sanitizePositiveInteger($event.target.value))"
          type="number"
          min="1"
          step="1"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          :placeholder="$t('plugins.pins.hotspotChannelPlaceholder')"
          :disabled="hotspotSaving || hotspotLoading || disabled"
        />

        <div v-if="selectedBandChannels.length" class="flex flex-wrap gap-2">
          <button
            v-for="channel in selectedBandChannels"
            :key="`hotspot-channel-${channel}`"
            type="button"
            class="px-3 py-1 rounded-full text-xs border transition-colors"
            :class="
              String(channel) === hotspotChannel
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-600 text-gray-300 hover:text-white hover:border-blue-400'
            "
            :disabled="hotspotSaving || hotspotLoading || disabled"
            @click="$emit('update:hotspotChannel', String(channel))"
          >
            {{ channel }}
          </button>
        </div>

        <p v-if="selectedBandCapabilitiesEmpty" class="text-xs text-amber-300">
          {{ $t('plugins.pins.hotspotCapabilitiesUnavailable') }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-gray-400 text-xs uppercase font-bold">{{
          $t('plugins.pins.hotspotNewPassword')
        }}</label>
        <input
          :value="hotspotPassword"
          @input="$emit('update:hotspotPassword', $event.target.value)"
          type="password"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          placeholder="********"
          :disabled="hotspotSaving || hotspotLoading || disabled"
        />
        <p class="text-xs text-gray-500">{{ $t('plugins.pins.hotspotPasswordHint') }}</p>
      </div>

      <div
        v-if="hotspotSaveResult"
        class="rounded-lg border p-3 text-sm"
        :class="
          hotspotSaveResult.appliedToActiveHotspot
            ? 'border-emerald-700 bg-emerald-900/20 text-emerald-200'
            : 'border-amber-700 bg-amber-900/20 text-amber-200'
        "
      >
        <p class="font-semibold">{{ hotspotSaveResult.message }}</p>
        <p class="text-xs mt-1">
          {{
            $t('plugins.pins.hotspotAppliedStatus', {
              applied: hotspotSaveResult.appliedToActiveHotspot
                ? $t('common.yes')
                : $t('common.no'),
              band: hotspotSaveResult.band || 'unset',
              channel:
                hotspotSaveResult.channel === null ||
                typeof hotspotSaveResult.channel === 'undefined'
                  ? 'unset'
                  : hotspotSaveResult.channel,
            })
          }}
        </p>
      </div>

      <button
        class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        :disabled="hotspotSaving || hotspotLoading || disabled || !canSaveHotspot"
        @click="$emit('save-hotspot')"
      >
        {{ hotspotSaving ? $t('plugins.pins.hotspotSaving') : $t('plugins.pins.hotspotSave') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import toggleButton from '@/components/helpers/toggleButton.vue';

const { t } = useI18n();

const props = defineProps({
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
    default: false,
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
  'update:selectedSsid',
  'update:wifiPassword',
  'update:selectedBand',
  'update:autoConnect',
  'update:selectedClientInterface',
  'update:selectedHotspotInterface',
  'update:hotspotPassword',
  'update:hotspotBand',
  'update:hotspotChannel',
  'load-hotspot',
  'save-hotspot',
]);

const selectedBandChannels = computed(() => {
  if (props.hotspotBand !== '2.4GHz' && props.hotspotBand !== '5GHz') {
    return [];
  }

  const candidates = props.supportedChannels?.[props.hotspotBand];
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
});

const selectedBandCapabilitiesEmpty = computed(() => {
  if (props.hotspotBand !== '2.4GHz' && props.hotspotBand !== '5GHz') {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(props.supportedChannels || {}, props.hotspotBand)) {
    return false;
  }

  return selectedBandChannels.value.length === 0;
});

const canSaveHotspot = computed(() => {
  const inlinePassword = String(props.hotspotPassword || '').trim();
  const passwordValidLength = inlinePassword.length >= 8 && inlinePassword.length <= 63;
  return passwordValidLength || props.hotspotCanSaveWithSessionPassword;
});

const wifiIsConnected = computed(() => Boolean(props.wifiStatus?.connected));
const desiredNetworkMode = computed(
  () => props.wifiMode?.desiredMode || props.wifiStatus?.desiredMode || 'unknown'
);
const observedNetworkMode = computed(
  () => props.wifiMode?.observedMode || props.wifiStatus?.observedMode || 'unknown'
);
const networkTransitionActive = computed(
  () =>
    props.supportsNetworkMode &&
    ['network-transition', 'probing', 'reconnecting'].includes(props.connectionState.phase)
);

const wifiStatusLabel = computed(() => {
  if (!wifiIsConnected.value) {
    return '';
  }

  const parts = [];
  if (props.wifiStatus?.ssid) {
    parts.push(props.wifiStatus.ssid);
  }
  if (props.wifiStatus?.ipAddress) {
    parts.push(props.wifiStatus.ipAddress);
  }
  if (props.wifiStatus?.interface) {
    parts.push(props.wifiStatus.interface);
  }
  if (props.wifiStatus?.band) {
    parts.push(props.wifiStatus.band);
  }

  return parts.join(' | ');
});

const isSelectedNetworkConnected = computed(() => {
  const connectedSsid = String(props.wifiStatus?.ssid || '').trim();
  const selected = String(props.selectedSsid || '').trim();
  return Boolean(wifiIsConnected.value && connectedSsid && selected && connectedSsid === selected);
});

const signalHistoryByKey = ref({});

const wifiConnectionRows = computed(() => {
  const rows = Array.isArray(props.wifiStatus?.connections) ? props.wifiStatus.connections : [];
  const normalized = rows
    .filter((connection) => connection && connection.connected)
    .map((connection) => normalizeWifiConnection(connection));

  if (normalized.length > 0) {
    return normalized;
  }

  if (!props.wifiStatus?.connected) {
    return [];
  }

  return [normalizeWifiConnection({ ...props.wifiStatus, role: 'client' })];
});

watch(
  wifiConnectionRows,
  (connections) => {
    const nextKeys = new Set();
    const nextHistory = { ...signalHistoryByKey.value };

    connections.forEach((connection) => {
      nextKeys.add(connection.key);
      if (!hasSignal(connection)) {
        return;
      }

      const existing = Array.isArray(nextHistory[connection.key])
        ? nextHistory[connection.key]
        : [];
      nextHistory[connection.key] = [...existing, connection.signalStrength].slice(-12);
    });

    Object.keys(nextHistory).forEach((key) => {
      if (!nextKeys.has(key)) {
        delete nextHistory[key];
      }
    });

    signalHistoryByKey.value = nextHistory;
  },
  { immediate: true }
);

function normalizeWifiConnection(connection) {
  const role = connection.role || 'client';
  const iface = connection.interface || '';
  const name = connection.ssid || connection.connectionName || '';
  const mobileSignal =
    role === 'hotspot' && mobileSignalMatchesConnection(connection) ? props.mobileWifiSignal : null;
  const rawSignal = mobileSignal?.signalStrength ?? connection.signalStrength;
  const signal =
    Number.isFinite(Number(rawSignal)) && Number(rawSignal) >= 0
      ? Math.min(100, Math.max(0, Number(rawSignal)))
      : null;

  return {
    ...connection,
    role,
    interface: iface,
    signalStrength: signal,
    quality: mobileSignal?.quality || connection.quality,
    rssiDbm: mobileSignal?.rssiDbm ?? connection.rssiDbm,
    measuredOnMobile: Boolean(mobileSignal),
    key: `${role}:${iface}:${name}`,
  };
}

function mobileSignalMatchesConnection(connection) {
  if (!props.mobileWifiSignal?.available || !props.mobileWifiSignal?.ssid) {
    return false;
  }

  const mobileSsid = normalizeSsid(props.mobileWifiSignal.ssid);
  const candidates = [connection.ssid, connection.connectionName]
    .map((value) => normalizeSsid(value))
    .filter(Boolean);

  if (candidates.includes(mobileSsid)) {
    return true;
  }

  if (connection.role !== 'hotspot') {
    return false;
  }

  const genericHotspotNames = ['Hotspot', 'hotspot-ap'].map((value) => normalizeSsid(value));
  const hasGenericHotspotName = candidates.some((candidate) =>
    genericHotspotNames.includes(candidate)
  );
  return hasGenericHotspotName && mobileSsid.startsWith('pins-');
}

function normalizeSsid(value) {
  return String(value || '')
    .trim()
    .replace(/^"|"$/g, '');
}

function hasSignal(connection) {
  return Number.isFinite(connection?.signalStrength);
}

function signalHistory(connection) {
  return signalHistoryByKey.value[connection.key] || [];
}

function signalBarClass(value) {
  if (value >= 70) {
    return 'bg-emerald-400';
  }
  if (value >= 40) {
    return 'bg-amber-400';
  }
  return 'bg-red-400';
}

function formatConnectionRole(role) {
  if (role === 'hotspot') {
    return t('plugins.pins.wifiRoleHotspot');
  }
  return t('plugins.pins.wifiRoleClient');
}

function sanitizePositiveInteger(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }

  const asNumber = Number(text);
  if (!Number.isInteger(asNumber) || asNumber < 1) {
    return '';
  }

  return String(asNumber);
}

function formatAdapterLabel(adapter) {
  if (!adapter || !adapter.interface) {
    return '';
  }

  const parts = [adapter.interface];
  if (adapter.role && adapter.role !== 'idle') {
    parts.push(adapter.role);
  }
  if (adapter.state) {
    parts.push(adapter.state);
  }
  if (adapter.driver) {
    parts.push(adapter.driver);
  }

  return parts.join(' | ');
}
</script>
