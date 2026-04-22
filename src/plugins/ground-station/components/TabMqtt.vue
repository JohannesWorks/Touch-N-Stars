<template>
  <FormShell service-id="mqtt" @save="save" @test="test">
    <!-- Broker -->
    <div class="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.mqtt.broker') }}
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow :label="$t('plugins.groundStation.mqtt.host')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttBrokerHost"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.port')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model.number="form.MqttBrokerPort"
              type="number"
              min="1"
              max="65535"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.username')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttUsername"
              type="text"
              autocomplete="username"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow
          :label="$t('plugins.groundStation.mqtt.password')"
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
        <FieldRow :label="$t('plugins.groundStation.mqtt.clientId')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttClientId"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.maxReconnect')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model.number="form.MqttMaxReconnectAttempts"
              type="number"
              min="0"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
      </div>
      <div class="flex items-center gap-3">
        <input id="gs-mqtt-tls" v-model="form.MqttBrokerUseTls" type="checkbox" class="h-4 w-4" />
        <label for="gs-mqtt-tls" class="text-sm text-gray-300">
          {{ $t('plugins.groundStation.mqtt.useTls') }}
        </label>
      </div>
    </div>

    <!-- Defaults -->
    <div class="mt-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.mqtt.defaults') }}
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow :label="$t('plugins.groundStation.mqtt.defaultTopic')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttDefaultTopic"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.defaultQos')">
          <template #default="{ inputId }">
            <select
              :id="inputId"
              v-model.number="form.MqttDefaultQoSLevel"
              class="default-select w-full h-10"
            >
              <option :value="0">0 — At most once</option>
              <option :value="1">1 — At least once</option>
              <option :value="2">2 — Exactly once</option>
            </select>
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.failureQos')">
          <template #default="{ inputId }">
            <select
              :id="inputId"
              v-model.number="form.MqttDefaultFailureQoSLevel"
              class="default-select w-full h-10"
            >
              <option :value="0">0</option>
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </template>
        </FieldRow>
      </div>
      <div class="flex items-center gap-3">
        <input
          id="gs-mqtt-retain"
          v-model="form.MqttDefaultRetain"
          type="checkbox"
          class="h-4 w-4"
        />
        <label for="gs-mqtt-retain" class="text-sm text-gray-300">
          {{ $t('plugins.groundStation.mqtt.defaultRetain') }}
        </label>
      </div>
    </div>

    <!-- LWT -->
    <div class="mt-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.mqtt.lwt') }}
      </h4>
      <div class="flex items-center gap-3">
        <input id="gs-mqtt-lwt" v-model="form.MqttLwtEnabled" type="checkbox" class="h-4 w-4" />
        <label for="gs-mqtt-lwt" class="text-sm text-gray-300">
          {{ $t('plugins.groundStation.mqtt.lwtEnabled') }}
        </label>
      </div>
      <FieldRow :label="$t('plugins.groundStation.mqtt.lwtTopic')">
        <template #default="{ inputId }">
          <input
            :id="inputId"
            v-model="form.MqttLwtTopic"
            type="text"
            class="default-input w-full h-10"
          />
        </template>
      </FieldRow>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldRow :label="$t('plugins.groundStation.mqtt.lwtBirth')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttLwtBirthPayload"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.lwtLastWill')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttLwtLastWillPayload"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.lwtClose')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttLwtClosePayload"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
      </div>
    </div>

    <!-- Image publisher -->
    <div class="mt-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('plugins.groundStation.mqtt.imagePublisher') }}
      </h4>
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <input
            id="gs-mqtt-imgenabled"
            v-model="form.MqttImagePubliserEnabled"
            type="checkbox"
            class="h-4 w-4"
          />
          <label for="gs-mqtt-imgenabled" class="text-sm text-gray-300">
            {{ $t('plugins.groundStation.mqtt.imagePublisherEnabled') }}
          </label>
        </div>
        <div class="flex items-center gap-3">
          <input
            id="gs-mqtt-metaonly"
            v-model="form.MqttImagePubliserMetadataOnly"
            type="checkbox"
            class="h-4 w-4"
          />
          <label for="gs-mqtt-metaonly" class="text-sm text-gray-300">
            {{ $t('plugins.groundStation.mqtt.metadataOnly') }}
          </label>
        </div>
        <div class="flex items-center gap-3">
          <input
            id="gs-mqtt-imgretain"
            v-model="form.MqttImagePublisherRetain"
            type="checkbox"
            class="h-4 w-4"
          />
          <label for="gs-mqtt-imgretain" class="text-sm text-gray-300">
            {{ $t('plugins.groundStation.mqtt.imageRetain') }}
          </label>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow :label="$t('plugins.groundStation.mqtt.imageTopic')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttImagePublisherImageTopic"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.metadataTopic')">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttImagePublisherMetdataTopic"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
        <FieldRow :label="$t('plugins.groundStation.mqtt.imageQos')">
          <template #default="{ inputId }">
            <select
              :id="inputId"
              v-model.number="form.MqttImagePublisherQoSLevel"
              class="default-select w-full h-10"
            >
              <option :value="0">0</option>
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </template>
        </FieldRow>
        <FieldRow
          :label="$t('plugins.groundStation.mqtt.imageTypes')"
          :hint="$t('plugins.groundStation.discord.imageTypesHint')"
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="form.MqttImageTypesSelected"
              type="text"
              class="default-input w-full h-10"
            />
          </template>
        </FieldRow>
      </div>
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
  MqttBrokerHost: '',
  MqttBrokerPort: 1883,
  MqttBrokerUseTls: false,
  MqttUsername: '',
  MqttClientId: '',
  MqttMaxReconnectAttempts: 5,
  MqttDefaultTopic: '',
  MqttDefaultQoSLevel: 0,
  MqttDefaultFailureQoSLevel: 0,
  MqttDefaultRetain: false,
  MqttLwtEnabled: false,
  MqttLwtTopic: '',
  MqttLwtBirthPayload: '',
  MqttLwtLastWillPayload: '',
  MqttLwtClosePayload: '',
  MqttImagePubliserEnabled: false,
  MqttImagePubliserMetadataOnly: false,
  MqttImagePublisherImageTopic: '',
  MqttImagePublisherMetdataTopic: '',
  MqttImagePublisherQoSLevel: 0,
  MqttImagePublisherRetain: false,
  MqttImageTypesSelected: '',
});

const passwordInput = ref('');

function syncFromStore() {
  const s = store.settings.mqtt;
  if (!s) return;
  form.MqttBrokerHost = s.BrokerHost ?? '';
  form.MqttBrokerPort = s.BrokerPort ?? 1883;
  form.MqttBrokerUseTls = !!s.BrokerUseTls;
  form.MqttUsername = s.Username ?? '';
  form.MqttClientId = s.ClientId ?? '';
  form.MqttMaxReconnectAttempts = s.MaxReconnectAttempts ?? 5;
  form.MqttDefaultTopic = s.DefaultTopic ?? '';
  form.MqttDefaultQoSLevel = s.DefaultQoSLevel ?? 0;
  form.MqttDefaultFailureQoSLevel = s.DefaultFailureQoSLevel ?? 0;
  form.MqttDefaultRetain = !!s.DefaultRetain;
  form.MqttLwtEnabled = !!s.LwtEnabled;
  form.MqttLwtTopic = s.LwtTopic ?? '';
  form.MqttLwtBirthPayload = s.LwtBirthPayload ?? '';
  form.MqttLwtLastWillPayload = s.LwtLastWillPayload ?? '';
  form.MqttLwtClosePayload = s.LwtClosePayload ?? '';
  form.MqttImagePubliserEnabled = !!s.ImagePublisherEnabled;
  form.MqttImagePubliserMetadataOnly = !!s.ImagePublisherMetadataOnly;
  form.MqttImagePublisherImageTopic = s.ImagePublisherImageTopic ?? '';
  form.MqttImagePublisherMetdataTopic = s.ImagePublisherMetadataTopic ?? '';
  form.MqttImagePublisherQoSLevel = s.ImagePublisherQoSLevel ?? 0;
  form.MqttImagePublisherRetain = !!s.ImagePublisherRetain;
  form.MqttImageTypesSelected = s.ImageTypesSelected ?? '';
}

watch(() => store.settings.mqtt, syncFromStore, { immediate: true });

async function save() {
  const patch = { ...form };
  if (passwordInput.value.length > 0) {
    patch.MqttPassword = passwordInput.value;
  }
  const ok = await store.saveService('mqtt', patch);
  if (ok) passwordInput.value = '';
}
async function test() {
  await store.testService('mqtt');
}
</script>
