<template>
  <FormShell service-id="telegram" @save="save" @test="test">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.telegram.accessToken')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.TelegramAccessToken"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.telegram.chatId')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.TelegramChatId"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
    </div>
    <div class="mt-4">
      <FieldRow :label="$t('plugins.groundStation.telegram.failureBody')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.TelegramFailureBodyText"
            rows="3"
            class="default-input w-full"
          />
        </template>
      </FieldRow>
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
  TelegramAccessToken: '',
  TelegramChatId: '',
  TelegramFailureBodyText: '',
});

function syncFromStore() {
  const s = store.settings.telegram;
  if (!s) return;
  form.TelegramAccessToken = s.AccessToken ?? '';
  form.TelegramChatId = s.ChatId ?? '';
  form.TelegramFailureBodyText = s.FailureBodyText ?? '';
}

watch(() => store.settings.telegram, syncFromStore, { immediate: true });

async function save() {
  await store.saveService('telegram', { ...form });
}
async function test() {
  await store.testService('telegram');
}
</script>
