<template>
  <FormShell service-id="ntfysh" @save="save" @test="test">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.ntfysh.url')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.NtfyShUrl"
            type="url"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.ntfysh.defaultTopic')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.NtfyShDefaultTopic"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.ntfysh.defaultIcon')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.NtfyShDefaultIcon"
            type="url"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.ntfysh.user')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.NtfyShUser"
            type="text"
            autocomplete="username"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow
        :label="$t('plugins.groundStation.ntfysh.password')"
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
      <FieldRow
        :label="$t('plugins.groundStation.ntfysh.token')"
        :hint="$t('plugins.groundStation.common.passwordUnchanged')"
      >
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="tokenInput"
            type="password"
            autocomplete="new-password"
            :placeholder="$t('plugins.groundStation.common.leaveEmpty')"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-5 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.ntfysh.failureNotification') }}
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow :label="$t('plugins.groundStation.ntfysh.failureTitle')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.NtfyShFailureTitle"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow
          :label="$t('plugins.groundStation.ntfysh.failureTags')"
          :hint="$t('plugins.groundStation.ntfysh.failureTagsHint')"
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.NtfyShFailureTags"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.ntfysh.failurePriority')">
          <template #default="{ inputId }">
            <select
              :id="inputId"
              v-model="form.NtfyShFailurePriority"
              class="default-select w-full h-10"
            >
              <option v-for="p in priorityOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </template>
        </FieldRow>
      </div>
      <FieldRow :label="$t('plugins.groundStation.ntfysh.failureMessage')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.NtfyShFailureMessage"
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
  NtfyShUrl: '',
  NtfyShDefaultTopic: '',
  NtfyShDefaultIcon: '',
  NtfyShUser: '',
  NtfyShFailureTitle: '',
  NtfyShFailureMessage: '',
  NtfyShFailureTags: '',
  NtfyShFailurePriority: 'Default',
});

const passwordInput = ref('');
const tokenInput = ref('');

const priorityOptions = ['Min', 'Low', 'Default', 'High', 'Max'];

function syncFromStore() {
  const s = store.settings.ntfysh;
  if (!s) return;
  form.NtfyShUrl = s.Url ?? '';
  form.NtfyShDefaultTopic = s.DefaultTopic ?? '';
  form.NtfyShDefaultIcon = s.DefaultIcon ?? '';
  form.NtfyShUser = s.User ?? '';
  form.NtfyShFailureTitle = s.FailureTitle ?? '';
  form.NtfyShFailureMessage = s.FailureMessage ?? '';
  form.NtfyShFailureTags = s.FailureTags ?? '';
  form.NtfyShFailurePriority = s.FailurePriority ?? 'Default';
}

watch(() => store.settings.ntfysh, syncFromStore, { immediate: true });

async function save() {
  const patch = { ...form };
  if (passwordInput.value.length > 0) patch.NtfyShPassword = passwordInput.value;
  if (tokenInput.value.length > 0) patch.NtfyShToken = tokenInput.value;
  const ok = await store.saveService('ntfysh', patch);
  if (ok) {
    passwordInput.value = '';
    tokenInput.value = '';
  }
}
async function test() {
  await store.testService('ntfysh');
}
</script>
