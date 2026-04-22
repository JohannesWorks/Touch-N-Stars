<template>
  <FormShell service-id="email" @save="save" @test="test">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.email.fromAddress')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.SmtpFromAddress"
            type="email"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow
        :label="$t('plugins.groundStation.email.recipients')"
        :hint="$t('plugins.groundStation.email.recipientsHint')"
      >
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.SmtpDefaultRecipients"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.email.host')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.SmtpHostName"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.email.port')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model.number="form.SmtpHostPort"
            type="number"
            min="1"
            max="65535"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.email.username')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.SmtpUsername"
            type="text"
            autocomplete="username"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow
        :label="$t('plugins.groundStation.email.password')"
        :hint="$t('plugins.groundStation.common.passwordUnchanged')"
      >
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="passwordInput"
            type="password"
            autocomplete="new-password"
            :placeholder="$t('plugins.groundStation.common.leaveEmpty')"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4">
      <FieldRow :label="$t('plugins.groundStation.email.failureSubject')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.EmailFailureSubjectText"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.email.failureBody')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.EmailFailureBodyText"
            rows="3"
            class="default-input w-full"
          />
        </template>
      </FieldRow>
    </div>
  </FormShell>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useGroundStationStore } from '../store/groundStationStore';
import FormShell from './FormShell.vue';
import FieldRow from './FieldRow.vue';

const store = useGroundStationStore();

const form = reactive({
  SmtpFromAddress: '',
  SmtpDefaultRecipients: '',
  SmtpHostName: '',
  SmtpHostPort: 587,
  SmtpUsername: '',
  EmailFailureSubjectText: '',
  EmailFailureBodyText: '',
});

const passwordInput = ref('');

function syncFromStore() {
  const s = store.settings.email;
  if (!s) return;
  form.SmtpFromAddress = s.FromAddress ?? '';
  form.SmtpDefaultRecipients = s.DefaultRecipients ?? '';
  form.SmtpHostName = s.HostName ?? '';
  form.SmtpHostPort = s.HostPort ?? 587;
  form.SmtpUsername = s.Username ?? '';
  form.EmailFailureSubjectText = s.FailureSubjectText ?? '';
  form.EmailFailureBodyText = s.FailureBodyText ?? '';
}

watch(() => store.settings.email, syncFromStore, { immediate: true });

async function save() {
  const patch = { ...form };
  if (passwordInput.value.length > 0) {
    patch.SmtpPassword = passwordInput.value;
  }
  const ok = await store.saveService('email', patch);
  if (ok) passwordInput.value = '';
}
async function test() {
  await store.testService('email');
}
</script>
