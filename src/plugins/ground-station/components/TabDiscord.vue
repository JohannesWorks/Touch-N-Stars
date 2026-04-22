<template>
  <FormShell service-id="discord" @save="save" @test="test">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.discord.defaultWebhook')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordWebhookDefaultUrl"
            type="url"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.discord.botName')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordWebhookDefaultBotName"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.discord.imageWebhook')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordImageWebhookUrl"
            type="url"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.discord.failureWebhook')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordFailureWebhookUrl"
            type="url"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.discord.failureTitle')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordWebhookFailureTitle"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.discord.imagePostTitle')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.DiscordImagePostTitle"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-4">
      <FieldRow :label="$t('plugins.groundStation.discord.failureMessage')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.DiscordWebhookFailureMessage"
            rows="3"
            class="default-input w-full"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-5 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.discord.imageEvents') }}
      </h4>
      <div class="flex items-center gap-3">
        <input
          id="gs-discord-imgenabled"
          v-model="form.DiscordImageEventEnabled"
          type="checkbox"
          class="h-4 w-4"
        />
        <label for="gs-discord-imgenabled" class="text-sm text-gray-300">
          {{ $t('plugins.groundStation.discord.imageEventEnabled') }}
        </label>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          :label="$t('plugins.groundStation.discord.imageTypes')"
          :hint="$t('plugins.groundStation.discord.imageTypesHint')"
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.DiscordImageTypesSelected"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.discord.imageInterval')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model.number="form.DiscordImageInterval"
              type="number"
              min="1"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
      </div>
    </div>
  </FormShell>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useGroundStationStore } from '../store/groundStationStore';
import FormShell from './FormShell.vue';
import FieldRow from './FieldRow.vue';

const store = useGroundStationStore();

const form = reactive({
  DiscordWebhookDefaultUrl: '',
  DiscordWebhookDefaultBotName: '',
  DiscordImageWebhookUrl: '',
  DiscordFailureWebhookUrl: '',
  DiscordWebhookFailureTitle: '',
  DiscordWebhookFailureMessage: '',
  DiscordImageEventEnabled: false,
  DiscordImageTypesSelected: '',
  DiscordImageInterval: 1,
  DiscordImagePostTitle: '',
});

function syncFromStore() {
  const s = store.settings.discord;
  if (!s) return;
  form.DiscordWebhookDefaultUrl = s.WebhookDefaultUrl ?? '';
  form.DiscordWebhookDefaultBotName = s.WebhookDefaultBotName ?? '';
  form.DiscordImageWebhookUrl = s.ImageWebhookUrl ?? '';
  form.DiscordFailureWebhookUrl = s.FailureWebhookUrl ?? '';
  form.DiscordWebhookFailureTitle = s.FailureTitle ?? '';
  form.DiscordWebhookFailureMessage = s.FailureMessage ?? '';
  form.DiscordImageEventEnabled = !!s.ImageEventEnabled;
  form.DiscordImageTypesSelected = s.ImageTypesSelected ?? '';
  form.DiscordImageInterval = s.ImageInterval ?? 1;
  form.DiscordImagePostTitle = s.ImagePostTitle ?? '';
}

watch(() => store.settings.discord, syncFromStore, { immediate: true });

async function save() {
  await store.saveService('discord', { ...form });
}
async function test() {
  await store.testService('discord');
}
</script>
