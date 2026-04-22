<template>
  <FormShell service-id="pushover" @save="save" @test="test">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldRow :label="$t('plugins.groundStation.pushover.userKey')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.PushoverUserKey"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.appKey')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.PushoverAppKey"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.notificationSound')">
        <template #default="{ inputId }">
          <select
            :id="inputId"
            v-model="form.PushoverDefaultNotificationSound"
            class="default-select w-full h-10"
          >
            <option v-for="opt in soundOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.notificationPriority')">
        <template #default="{ inputId }">
          <select
            :id="inputId"
            v-model="form.PushoverDefaultNotificationPriority"
            class="default-select w-full h-10"
          >
            <option v-for="opt in priorityOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.failureSound')">
        <template #default="{ inputId }">
          <select
            :id="inputId"
            v-model="form.PushoverDefaultFailureSound"
            class="default-select w-full h-10"
          >
            <option v-for="opt in soundOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.failurePriority')">
        <template #default="{ inputId }">
          <select
            :id="inputId"
            v-model="form.PushoverDefaultFailurePriority"
            class="default-select w-full h-10"
          >
            <option v-for="opt in priorityOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </template>
      </FieldRow>
      <FieldRow
        :label="$t('plugins.groundStation.pushover.emergRetry')"
        :hint="$t('plugins.groundStation.pushover.emergRetryHint')"
      >
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model.number="form.PushoverEmergRetryInterval"
            type="number"
            min="30"
            max="86400"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow
        :label="$t('plugins.groundStation.pushover.emergExpire')"
        :hint="$t('plugins.groundStation.pushover.emergExpireHint')"
      >
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model.number="form.PushoverEmergExpireAfter"
            type="number"
            min="30"
            max="86400"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4">
      <FieldRow :label="$t('plugins.groundStation.pushover.failureTitle')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.PushoverFailureTitleText"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <FieldRow :label="$t('plugins.groundStation.pushover.failureBody')">
        <template #default="{ inputId }">
          <textarea
            :id="inputId"
            v-model="form.PushoverFailureBodyText"
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
  PushoverUserKey: '',
  PushoverAppKey: '',
  PushoverDefaultNotificationSound: 'Pushover',
  PushoverDefaultNotificationPriority: 'Normal',
  PushoverDefaultFailureSound: 'Pushover',
  PushoverDefaultFailurePriority: 'Normal',
  PushoverEmergRetryInterval: 60,
  PushoverEmergExpireAfter: 3600,
  PushoverFailureTitleText: '',
  PushoverFailureBodyText: '',
});

// Pushover sound enum (from Ground Station plugin)
const soundOptions = [
  'Pushover',
  'Bike',
  'Bugle',
  'CashRegister',
  'Classical',
  'Cosmic',
  'Falling',
  'Gamelan',
  'Incoming',
  'Intermission',
  'Magic',
  'Mechanical',
  'PianoBar',
  'Siren',
  'SpaceAlarm',
  'TugBoat',
  'Alien',
  'Climb',
  'Persistent',
  'Echo',
  'UpDown',
  'Vibrate',
  'None',
];

const priorityOptions = ['Lowest', 'Low', 'Normal', 'High', 'Emergency'];

function syncFromStore() {
  const s = store.settings.pushover;
  if (!s) return;
  form.PushoverUserKey = s.UserKey ?? '';
  form.PushoverAppKey = s.AppKey ?? '';
  form.PushoverDefaultNotificationSound = s.DefaultNotificationSound ?? 'Pushover';
  form.PushoverDefaultNotificationPriority = s.DefaultNotificationPriority ?? 'Normal';
  form.PushoverDefaultFailureSound = s.DefaultFailureSound ?? 'Pushover';
  form.PushoverDefaultFailurePriority = s.DefaultFailurePriority ?? 'Normal';
  form.PushoverEmergRetryInterval = s.EmergRetryInterval ?? 60;
  form.PushoverEmergExpireAfter = s.EmergExpireAfter ?? 3600;
  form.PushoverFailureTitleText = s.FailureTitleText ?? '';
  form.PushoverFailureBodyText = s.FailureBodyText ?? '';
}

watch(() => store.settings.pushover, syncFromStore, { immediate: true });

async function save() {
  await store.saveService('pushover', { ...form });
}

async function test() {
  await store.testService('pushover');
}
</script>
