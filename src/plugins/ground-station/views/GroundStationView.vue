<template>
  <div class="min-h-screen bg-gray-900 pb-10">
    <div class="container py-8 max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-white">{{ $t('plugins.groundStation.title') }}</h1>
        <p class="text-gray-400 text-sm">
          {{ $t('plugins.groundStation.subtitle') }}
          <span v-if="store.pluginVersion" class="text-gray-500 ml-1">
            ({{ store.pluginVersion }})
          </span>
        </p>
      </div>

      <!-- Loading status -->
      <div
        v-if="!store.statusChecked"
        class="rounded-xl border border-gray-700 bg-gray-800/60 p-5 text-gray-300 text-sm"
      >
        {{ $t('plugins.groundStation.common.loading') }}
      </div>

      <!-- Plugin not loaded notice -->
      <div
        v-else-if="!store.pluginInstalled"
        class="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-yellow-200 text-sm"
      >
        {{ $t('plugins.groundStation.notLoaded') }}
      </div>

      <!-- Tab bar + content -->
      <div v-else class="mb-4 border border-gray-700 rounded-xl bg-gray-800 overflow-hidden">
        <div class="flex border-b border-gray-700 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="store.activeTab = tab.id"
            :class="[
              'px-5 py-3 text-sm font-semibold transition whitespace-nowrap flex-shrink-0',
              store.activeTab === tab.id
                ? 'border-b-2 border-cyan-400 text-white'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="p-5">
          <component :is="activeComponent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGroundStationStore, SERVICES } from '../store/groundStationStore';

import TabPushover from '../components/TabPushover.vue';
import TabTelegram from '../components/TabTelegram.vue';
import TabEmail from '../components/TabEmail.vue';
import TabDiscord from '../components/TabDiscord.vue';
import TabSlack from '../components/TabSlack.vue';
import TabMqtt from '../components/TabMqtt.vue';
import TabIfttt from '../components/TabIfttt.vue';
import TabNtfysh from '../components/TabNtfysh.vue';

const { t } = useI18n();
const store = useGroundStationStore();

const componentMap = {
  pushover: TabPushover,
  telegram: TabTelegram,
  email: TabEmail,
  discord: TabDiscord,
  slack: TabSlack,
  mqtt: TabMqtt,
  ifttt: TabIfttt,
  ntfysh: TabNtfysh,
};

const tabs = computed(() =>
  SERVICES.map((id) => ({ id, label: t(`plugins.groundStation.tabs.${id}`) }))
);

const activeComponent = computed(() => componentMap[store.activeTab]);

onMounted(() => {
  store.initialize();
});
</script>
