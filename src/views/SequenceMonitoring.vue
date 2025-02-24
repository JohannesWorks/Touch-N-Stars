<template>
  <!-- Modal -->
  <transition name="fade">
    <div
      v-if="showSettingsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 relative shadow-xl shadow-black">
        <!-- Schließen-Button oben rechts -->
        <button
          @click="showSettingsModal = false"
          class="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Modal-Inhalt -->
        <h3 class="text-lg font-bold mb-4 text-gray-100">
          {{ $t('components.sequence.monitor.settings.title') }}
        </h3>
        <div class="flex justify-end space-x-4">
          <MonitorViewSetting class="w-full" />
        </div>
      </div>
    </div>
  </transition>

  <button
    type="button"
    class="z-10 p-2 rounded-full bg-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 fixed bottom-11 right-4"
    @click="showSettingsModal = true"
    aria-label="Open settings"
  >
    <Cog6ToothIcon class="icon" />
  </button>

  <SubNav
    :items="[
      { name: $t('components.sequence.stats'), value: 'showStats' },
      { name: $t('components.sequence.imageHistory'), value: 'showImageHistory' },
    ]"
    v-model:activeItem="currentTab"
  />

  <div class="flex items-center justify-center mx-6 my-16">
    <div v-if="currentTab == 'showStats'">
      <div
        v-if="store.imageHistoryInfo && store.imageHistoryInfo.length > 0"
        class="flex flex-col w-full max-w-4xl justify-center items-center space-y-4"
      >
        <div class="mt-5 w-full">
          <LastSequenceImg  />
        </div>

        <div
          v-if="settingsStore.monitorViewSetting.showImgStatsGraph "
          class=" w-full min-w-[80vw] min-h-60 border border-cyan-700 bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl"
        >
          <SequenzGraph />
        </div>
        <div
          v-if="settingsStore.monitorViewSetting.showGuiderGraph && store.guiderInfo.Connected"
          class="flex w-full min-h-40 border border-cyan-700 bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl p-2"
        >
          <GuiderStats class="min-w-24 pt-4" />
          <GuiderGraph class="w-full" />
        </div>
        <div
          class="flex flex-col w-full min-h-80 border border-cyan-700 bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl p-2"
          v-if="settingsStore.monitorViewSetting.showGuiderAfGraph && store.focuserInfo.Connected"
        >
          <p class="mb-4 text-center">{{ $t('components.focuser.last_autofocus') }}</p>
          <AutofocusGrafik class="flex-grow h-screen-3/4" />
        </div>
        <div class="p-5"></div>
      </div>
      <div v-else class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-red-400 font-medium">{{ $t('components.sequence.noSequenceData') }}</p>
      </div>
    </div>

    <div v-if="currentTab == 'showImageHistory'" class="mt-5">
      <SequenceImageHistory />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SubNav from '@/components/SubNav.vue';
import SequenceImageHistory from '@/components/sequence/SequenceImageHistory.vue';
import LastSequenceImg from '@/components/sequence/LastSequenceImg.vue';
import SequenzGraph from '@/components/sequence/SequenzGraph.vue';
import GuiderGraph from '@/components/guider/GuiderGraph.vue';
import GuiderStats from '@/components/guider/GuiderStats.vue';
import AutofocusGrafik from '@/components/focuser/AutofocusGrafik.vue';
import MonitorViewSetting from '@/components/sequence/MonitorViewSetting.vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const currentTab = ref('showStats');

const store = apiStore();
const settingsStore = useSettingsStore();
const showSettingsModal = ref(false);

</script>

<style>
.icon {
  width: 24px;
  height: 24px;
}
</style>
