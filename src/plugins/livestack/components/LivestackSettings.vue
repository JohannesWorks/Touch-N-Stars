<template>
  <div class="relative inline-block">
    <button
      class="flex items-center justify-center p-1 w-10 h-10 rounded-full mr-2 bg-gray-600 text-white border border-gray-400 z-top"
      @click="toggleConfiguration"
    >
      <Cog6ToothIcon class="w-6 h-6" />
    </button>

    <Teleport to="body">
      <div
        v-if="showConfiguration"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click="showConfiguration = false"
      >
        <div
          class="w-80 sm:w-96 max-h-[85vh] overflow-y-auto bg-gray-900/95 border border-gray-600 rounded-lg shadow-xl p-4"
          @click.stop
        >
          <div class="flex items-center justify-between w-full mb-3 pb-2 border-b border-gray-700">
            <h2 class="text-lg font-semibold text-gray-100 tracking-tight">
              {{ t('plugins.livestack.configuration_title') }}
            </h2>
            <button class="text-gray-400 hover:text-gray-200" @click="showConfiguration = false">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <div class="flex flex-col w-full gap-2">
            <div
              class="flex flex-row items-center gap-4 w-full min-w-28 border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <label
                for="toggle_osc_components"
                class="flex-1 text-xs md:text-sm text-gray-200 pl-2"
              >
                {{ t('plugins.livestack.show_rgb_only') }}
              </label>
              <toggleButton
                id="toggle_osc_components"
                @click="store.toogleShowFilters()"
                :status-value="!store.showFilters"
                class="ml-auto px-3 justify-center z-40"
              />
            </div>
            <div
              class="flex flex-row items-center gap-4 w-full min-w-28 border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <label
                for="toggle_tracking_stacks"
                class="flex-1 text-xs md:text-sm text-gray-200 pl-2"
              >
                {{ t('plugins.livestack.track_stack_updates') }}
              </label>
              <toggleButton
                id="toggle_tracking_stacks"
                @click="store.setTrackingStacks(!store.isTrackingStacks)"
                :status-value="store.isTrackingStacks"
                class="ml-auto px-3 justify-center z-40"
              />
            </div>

            <!-- Livestack's "Save stacked lights": the raw-data histogram reads the saved
                 stacks. Hidden when the plugin server is too old to report the option. -->
            <div
              v-if="store.saveStackedLights !== null"
              class="flex flex-col gap-1 w-full min-w-28 border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <div class="flex flex-row items-center gap-4 w-full">
                <label
                  for="toggle_save_stacked_lights"
                  class="flex-1 text-xs md:text-sm text-gray-200 pl-2"
                >
                  {{ t('plugins.livestack.save_stacked_lights') }}
                </label>
                <toggleButton
                  id="toggle_save_stacked_lights"
                  @click="
                    !store.saveStackedLightsBusy &&
                    store.setSaveStackedLights(!store.saveStackedLights)
                  "
                  :status-value="store.saveStackedLights"
                  class="ml-auto px-3 justify-center z-40"
                />
              </div>
              <p class="text-xs text-gray-400 pl-2">
                {{ t('plugins.livestack.save_stacked_lights_hint') }}
              </p>
            </div>

            <!-- RGB combination. Only on PINS - on Windows NINA the livestack plugin
                 provides its own WPF wizard for this. -->
            <div
              v-if="apiState.isPINS"
              class="flex flex-col gap-2 w-full border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <h3 class="text-xs md:text-sm font-semibold text-gray-200 pl-2">
                {{ t('plugins.livestack.rgb.title') }}
              </h3>

              <p v-if="!store.rgbCandidates.length" class="text-xs text-gray-400 pl-2">
                {{ t('plugins.livestack.rgb.no_targets') }}
              </p>

              <template v-else>
                <label class="text-xs text-gray-300 pl-2" for="rgb_target">
                  {{ t('plugins.livestack.rgb.target') }}
                </label>
                <select id="rgb_target" v-model="selectedTarget" class="tns-select w-full text-sm">
                  <option
                    v-for="candidate in store.rgbCandidates"
                    :key="candidate.Target"
                    :value="candidate.Target"
                  >
                    {{ candidate.Target }}
                  </option>
                </select>

                <template v-if="selectedCandidate">
                  <div v-for="channel in channels" :key="channel.key" class="flex flex-col">
                    <label class="text-xs text-gray-300 pl-2" :for="`rgb_${channel.key}`">
                      {{ t(channel.label) }}
                    </label>
                    <select
                      :id="`rgb_${channel.key}`"
                      v-model="channelSelection[channel.key]"
                      class="tns-select w-full text-sm"
                    >
                      <option
                        v-for="filter in selectedCandidate.Filters"
                        :key="filter"
                        :value="filter"
                      >
                        {{ filter }}
                      </option>
                    </select>
                  </div>

                  <p v-if="store.rgbError" class="text-xs text-red-400 pl-2 break-words">
                    {{ store.rgbError }}
                  </p>

                  <div class="flex flex-row gap-2">
                    <button
                      class="tns-btn-primary flex-1"
                      :disabled="store.rgbBusy || !isSelectionComplete"
                      @click="onCreate"
                    >
                      {{
                        store.rgbBusy
                          ? t('plugins.livestack.rgb.working')
                          : t('plugins.livestack.rgb.create')
                      }}
                    </button>
                    <button
                      v-if="selectedCandidate.HasRgb"
                      class="tns-btn-danger flex-1"
                      :disabled="store.rgbBusy"
                      @click="onDelete"
                    >
                      {{ t('plugins.livestack.rgb.remove') }}
                    </button>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useLivestackStore } from '../store/livestackStore.js';

const showConfiguration = ref(false);
const store = useLivestackStore();
const apiState = apiStore();
const { t } = useI18n();

const channels = [
  { key: 'red', label: 'plugins.livestack.rgb.red' },
  { key: 'green', label: 'plugins.livestack.rgb.green' },
  { key: 'blue', label: 'plugins.livestack.rgb.blue' },
];

const selectedTarget = ref(null);
const channelSelection = ref({ red: null, green: null, blue: null });

const selectedCandidate = computed(() =>
  store.rgbCandidates.find((candidate) => candidate.Target === selectedTarget.value)
);

const isSelectionComplete = computed(
  () => channelSelection.value.red && channelSelection.value.green && channelSelection.value.blue
);

function applySuggestion(candidate) {
  channelSelection.value = {
    red: candidate?.SuggestedRed ?? null,
    green: candidate?.SuggestedGreen ?? null,
    blue: candidate?.SuggestedBlue ?? null,
  };
}

async function toggleConfiguration() {
  showConfiguration.value = !showConfiguration.value;
  if (showConfiguration.value) store.loadLivestackSettings();
  if (showConfiguration.value && apiState.isPINS) {
    await store.loadRgbCandidates();
    if (!selectedCandidate.value) {
      selectedTarget.value = store.rgbCandidates[0]?.Target ?? null;
    }
  }
}

watch(selectedCandidate, (candidate) => {
  applySuggestion(candidate);
  // Drop an error from a previous target so it does not stick to the new selection
  store.rgbError = null;
});

async function onCreate() {
  await store.createRgbCombination({
    target: selectedTarget.value,
    red: channelSelection.value.red,
    green: channelSelection.value.green,
    blue: channelSelection.value.blue,
  });
}

async function onDelete() {
  await store.deleteRgbCombination(selectedTarget.value);
}
</script>
