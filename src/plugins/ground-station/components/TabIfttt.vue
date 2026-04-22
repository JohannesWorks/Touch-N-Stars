<template>
  <FormShell service-id="ifttt" @save="save" @test="test">
    <FieldRow :label="$t('plugins.groundStation.ifttt.webhookKey')">
      <template #default="{ inputId }">
        <input
          :id="inputId"
          v-model="form.IftttWebhookKey"
          type="text"
          class="default-input w-full h-10"
        />
      </template>
    </FieldRow>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <FieldRow :label="$t('plugins.groundStation.ifttt.value1')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.IftttFailureValue1"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.ifttt.value2')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.IftttFailureValue2"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.ifttt.value3')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.IftttFailureValue3"
            type="text"
            class="default-input w-full h-10"
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
  IftttWebhookKey: '',
  IftttFailureValue1: '',
  IftttFailureValue2: '',
  IftttFailureValue3: '',
});

function syncFromStore() {
  const s = store.settings.ifttt;
  if (!s) return;
  form.IftttWebhookKey = s.WebhookKey ?? '';
  form.IftttFailureValue1 = s.FailureValue1 ?? '';
  form.IftttFailureValue2 = s.FailureValue2 ?? '';
  form.IftttFailureValue3 = s.FailureValue3 ?? '';
}

watch(() => store.settings.ifttt, syncFromStore, { immediate: true });

async function save() {
  await store.saveService('ifttt', { ...form });
}
async function test() {
  await store.testService('ifttt');
}
</script>
