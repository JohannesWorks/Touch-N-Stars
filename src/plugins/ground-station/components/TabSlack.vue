<template>
  <FormShell service-id="slack" :hide-test="true" @save="save">
    <template #extra-actions>
      <button
        type="button"
        @click="refreshChannels"
        :disabled="store.refreshingSlackChannels"
        class="px-4 py-2 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{
          store.refreshingSlackChannels
            ? $t('plugins.groundStation.slack.refreshing')
            : $t('plugins.groundStation.slack.refreshChannels')
        }}
      </button>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.slack.oauthToken')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.SlackOAuthToken"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.slack.workspace')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            :value="slack?.WorkspaceName ?? ''"
            readonly
            type="text"
            class="default-input w-full h-10 opacity-70"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.slack.botDisplayName')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            :value="slack?.BotDisplayName ?? ''"
            readonly
            type="text"
            class="default-input w-full h-10 opacity-70"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.slack.imageEventChannel')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            :value="slack?.ImageEventChannel?.Name ?? ''"
            readonly
            type="text"
            class="default-input w-full h-10 opacity-70"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-4">
      <FieldRow :label="$t('plugins.groundStation.slack.failureMessage')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.SlackFailureMessage"
            rows="3"
            class="default-input w-full"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-5 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.slack.imageEvents') }}
      </h4>
      <div class="flex items-center gap-3">
        <input
          id="gs-slack-imgenabled"
          v-model="form.SlackImageEventEnabled"
          type="checkbox"
          class="h-4 w-4"
        />
        <label for="gs-slack-imgenabled" class="text-sm text-gray-300">
          {{ $t('plugins.groundStation.slack.imageEventEnabled') }}
        </label>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          :label="$t('plugins.groundStation.slack.imageTypes')"
          :hint="$t('plugins.groundStation.discord.imageTypesHint')"
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.SlackImageTypesSelected"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.slack.imageInterval')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model.number="form.SlackImageInterval"
              type="number"
              min="1"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
      </div>
    </div>

    <div
      v-if="store.slackRefreshError"
      class="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200"
    >
      {{ store.slackRefreshError }}
    </div>

    <div v-if="channelList.length" class="mt-5">
      <h4 class="text-sm font-semibold text-gray-200 mb-2">
        {{ $t('plugins.groundStation.slack.channels') }} ({{ channelList.length }})
      </h4>
      <div
        class="max-h-56 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/40 divide-y divide-gray-800"
      >
        <div
          v-for="ch in channelList"
          :key="ch.Id"
          class="flex items-center justify-between px-3 py-2 text-xs text-gray-300"
        >
          <span class="font-mono">
            <span class="text-gray-500">#</span>{{ ch.Name }}
            <span v-if="ch.IsPrivate" class="ml-1 text-yellow-400">(private)</span>
          </span>
          <span class="text-gray-500"
            >{{ ch.NumMembers }} {{ $t('plugins.groundStation.slack.members') }}</span
          >
        </div>
      </div>
    </div>
  </FormShell>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useGroundStationStore } from '../store/groundStationStore';
import FormShell from './FormShell.vue';
import FieldRow from './FieldRow.vue';

const store = useGroundStationStore();

const slack = computed(() => store.settings.slack);
const channelList = computed(() => slack.value?.Channels ?? []);

const form = reactive({
  SlackOAuthToken: '',
  SlackFailureMessage: '',
  SlackImageEventEnabled: false,
  SlackImageTypesSelected: '',
  SlackImageInterval: 1,
});

function syncFromStore() {
  const s = store.settings.slack;
  if (!s) return;
  form.SlackOAuthToken = s.OAuthToken ?? '';
  form.SlackFailureMessage = s.FailureMessage ?? '';
  form.SlackImageEventEnabled = !!s.ImageEventEnabled;
  form.SlackImageTypesSelected = s.ImageTypesSelected ?? '';
  form.SlackImageInterval = s.ImageInterval ?? 1;
}

watch(() => store.settings.slack, syncFromStore, { immediate: true });

async function save() {
  await store.saveService('slack', { ...form });
}
async function refreshChannels() {
  await store.refreshSlackChannels();
}
</script>
