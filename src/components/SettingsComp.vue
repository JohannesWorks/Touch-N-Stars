<template>
  <div class="p-4 max-w-md mx-auto">
    <div class="bg-gray-800 p-4 rounded-lg">
      <h2 class="text-xl font-semibold mb-4 text-white">
        {{ $t('components.settings.title') }}
      </h2>

      <div class="space-y-4">
        <!-- GPS Coordinates -->
        <div v-if="store.isBackendReachable" class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-lg font-medium mb-2 text-gray-300">
            {{ $t('components.settings.coordinates') }}
          </h3>
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">Latitude</label>
              <input
                v-model="latitude"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Latitude"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">Longitude</label>
              <input
                v-model="longitude"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Longitude"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">Altitude</label>
              <input
                v-model="altitude"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Altitude"
              />
            </div>
            <button
              @click="getCurrentLocation"
              class="mt-6 p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
              title="Get current location"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <div v-if="gpsError" class="mt-2 text-sm text-red-400">
            {{ gpsError }}
          </div>
          <button
            @click="saveCoordinates"
            class="w-full mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
          >
            {{ $t('components.settings.save') }}
          </button>
        </div>

        <!-- Connection Settings -->
        <div class="bg-gray-700 p-3 rounded-lg" v-if="Capacitor.getPlatform() === 'android'">
          <h3 class="text-lg font-medium mb-2 text-gray-300">
            {{ $t('components.settings.connection') }}
          </h3>

          <!-- Instance List -->
          <div class="mb-4">
            <div
              v-for="instance in instances"
              :key="instance.id"
              class="bg-gray-600 p-2 rounded mb-2"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{{ instance.name }}</div>
                  <div class="text-sm text-gray-400">{{ instance.ip }}:{{ instance.port }}</div>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="selectInstance(instance)"
                    :class="[
                      'p-1 transition-colors',
                      selectedInstance === instance.id
                        ? 'text-green-500'
                        : 'text-gray-300 hover:text-green-500',
                    ]"
                    title="Select Instance"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    @click="editInstance(instance.id)"
                    class="p-1 text-gray-300 hover:text-cyan-500 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                      />
                    </svg>
                  </button>
                  <button
                    @click="removeInstance(instance.id)"
                    class="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add/Edit Instance Form -->
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                v-model="tempInstance.name"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Instance Name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">IP / FQDN</label>
              <input
                v-model="tempInstance.ip"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="192.168.x.x"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Port</label>
              <input
                v-model="tempInstance.port"
                type="text"
                class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="5000"
              />
            </div>
            <div v-if="emptyFieldsError" class="mt-2 text-sm text-red-400">
              {{ $t('components.settings.errors.emptyFields') }}
            </div>
            <button
              @click="saveInstance"
              class="w-full mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
            >
              {{
                editingInstance ? $t('components.settings.update') : $t('components.settings.add')
              }}
            </button>
          </div>
        </div>

        <!-- Language Selection -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-lg font-medium mb-2 text-gray-300">
            {{ $t('components.settings.language') }}
          </h3>
          <select
            v-model="currentLanguage"
            @change="changeLanguage($event.target.value)"
            class="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          >
            <option
              v-for="lang in languages"
              :key="lang.code"
              :value="lang.code"
              class="bg-gray-700"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>

        <!-- Image settings -->
        <div v-if="store.isBackendReachable" class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-lg font-medium mb-2 text-gray-300">
            {{ $t('components.settings.image.title') }}
          </h3>
          <setImgQuality />
          <setImgStrechFactor />
          <setImgBlackClipping />
        </div>

        <!-- Tutorial Button -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <button
            @click="showTutorial"
            class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
          >
            {{ $t('components.settings.showTutorial') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tutorial Modal -->
    <TutorialModal v-if="showTutorialModal" :steps="tutorialSteps" @close="closeTutorial" />

    <!-- System Controls -->
    <div class="bg-gray-700 p-3 rounded-lg mt-4">
      <div class="text-center mb-2">
        <h3 class="text-gray-300 font-semibold text-sm mb-1">
          {{ $t('components.settings.system.title') }}
        </h3>
        <p class="text-gray-400 text-xs">{{ $t('components.settings.system.description') }}</p>
      </div>
      <div class="flex justify-center gap-2">
        <!-- Restart Button -->
        <button
          @click="restartSystem"
          class="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          title="Restart System"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <!-- Shutdown Button -->
        <button
          @click="shutdownSystem"
          class="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          title="Shutdown System"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-gray-300"
            viewBox="0 0 325.214 325.214"
            fill="currentColor"
          >
            <path
              d="M288.777,93.565c-15.313-23.641-36.837-42.476-62.243-54.472c-1.616-0.763-3.109-1.134-4.564-1.134
          c-1.969,0-8.392,0.833-8.392,11.541v17.75c0,8.998,5.479,13.113,7.159,14.16c32.613,20.33,52.083,55.317,52.083,93.59
          c0,60.772-49.442,110.214-110.214,110.214S52.393,235.772,52.393,175c0-38.872,19.942-74.144,53.346-94.353
          c4.475-2.707,6.839-7.426,6.839-13.647V49c0-7.959-5.077-10.783-9.424-10.783c-1.714,0-3.542,0.422-5.144,1.188
          C72.781,51.471,51.42,70.305,36.237,93.872C20.638,118.084,12.393,146.137,12.393,175c0,82.828,67.386,150.214,150.214,150.214
          S312.821,257.828,312.821,175C312.821,146.008,304.507,117.848,288.777,93.565z"
            />
            <path
              d="M152.579,117h21c5.514,0,10-4.486,10-10V10c0-5.514-4.486-10-10-10h-21c-5.514,0-10,4.486-10,10v97
          C142.579,112.514,147.064,117,152.579,117z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div
    v-if="confirmAction"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div class="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
      <h3 class="text-lg font-semibold text-white mb-4">
        {{ $t('components.settings.system.confirmation') }}
      </h3>
      <p class="text-gray-300 mb-6">
        {{
          confirmAction === 'shutdown'
            ? $t('components.settings.system.confirmShutdown')
            : $t('components.settings.system.confirmRestart')
        }}
      </p>
      <div class="flex justify-end space-x-4">
        <button
          @click="cancelConfirmation"
          class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="confirmActionHandler"
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md"
        >
          {{ $t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, watch, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import TutorialModal from '@/components/TutorialModal.vue';
import { Geolocation } from '@capacitor/geolocation';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import setImgStrechFactor from '@/components/settings/setImgStrechFactor.vue';
import setImgQuality from '@/components/settings/setImgQuality.vue';
import setImgBlackClipping from '@/components/settings/setImgBlackClipping.vue';

const router = useRouter();
const { locale } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const currentLanguage = ref(settingsStore.getLanguage());
const latitude = ref('');
const longitude = ref('');
const altitude = ref('');
const gpsError = ref(null);

// Instance management
const instances = computed(() => settingsStore.connection.instances);
const editingInstance = ref(null);
const selectedInstance = ref(settingsStore.selectedInstanceId);

// Tutorial
const showTutorialModal = ref(false);
const tutorialSteps = computed(() => settingsStore.tutorial.steps);

// Sync selected instance with store
watch(selectedInstance, (newId) => {
  settingsStore.setSelectedInstanceId(newId);
});
const emptyFieldsError = ref(false);
const tempInstance = ref({
  name: '',
  ip: '',
  port: '',
});

const languages = getAvailableLanguages();

// Load stored settings on mount
onMounted(() => {
  // Set initial language from store
  locale.value = settingsStore.getLanguage();

  const storedCoords = settingsStore.coordinates;
  if (storedCoords) {
    latitude.value = storedCoords.latitude;
    longitude.value = storedCoords.longitude;
    altitude.value = storedCoords.altitude || 0;
  }
});

watchEffect(() => {
  currentLanguage.value = locale.value;
});

// Load coordinates when backend is reachable
watch(
  () => store.isBackendReachable,
  async (newValue) => {
    if (newValue) {
      try {
        await store.fetchProfilInfos();
        latitude.value = store.profileInfo.AstrometrySettings.Latitude;
        longitude.value = store.profileInfo.AstrometrySettings.Longitude;
        altitude.value = store.profileInfo.AstrometrySettings.Elevation;
        settingsStore.setCoordinates({
          latitude: latitude.value,
          longitude: longitude.value,
          altitude: altitude.value,
        });
      } catch (error) {
        console.log('Error loading coordinates');
      }
    }
  }
);

function changeLanguage(lang) {
  locale.value = lang;
  settingsStore.setLanguage(lang);
}

// Instance management methods
const instanceError = ref(null);

function saveInstance() {
  // Clear errors before validation
  emptyFieldsError.value = false;
  instanceError.value = null;

  // Validate fields
  if (!tempInstance.value.name || !tempInstance.value.ip || !tempInstance.value.port) {
    emptyFieldsError.value = true;
    return;
  }

  // Save instance
  if (editingInstance.value) {
    settingsStore.updateInstance(editingInstance.value, tempInstance.value);
  } else {
    settingsStore.addInstance({
      id: Date.now().toString(),
      ...tempInstance.value,
    });
  }

  // Clear form after successful save
  editingInstance.value = null;
  emptyFieldsError.value = false;
  tempInstance.value = { name: '', ip: '', port: '' };
}

function editInstance(id) {
  const instance = instances.value.find((i) => i.id === id);
  if (instance) {
    tempInstance.value = { ...instance };
    editingInstance.value = id;
  }
}

function selectInstance(instance) {
  selectedInstance.value = instance.id;
  settingsStore.setSelectedInstanceId(instance.id);
}

function removeInstance(id) {
  settingsStore.removeInstance(id);
}

async function getCurrentLocation() {
  try {
    // Check for location permission
    const status = await Geolocation.checkPermissions();
    if (status.location !== 'granted') {
      const result = await Geolocation.requestPermissions();
      if (result.location !== 'granted') {
        gpsError.value = 'Location permission not granted';
        return;
      }
    }
    // Get current position with high accuracy
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    latitude.value = pos.coords.latitude.toFixed(6);
    longitude.value = pos.coords.longitude.toFixed(6);
    altitude.value = pos.coords.altitude;
    gpsError.value = null;
  } catch (error) {
    gpsError.value = error.message || 'Failed to get GPS location';
  }
}

async function saveCoordinates() {
  if (store.isBackendReachable) {
    try {
      await apiService.profileChangeValue('AstrometrySettings-Latitude', latitude.value);
      await apiService.profileChangeValue('AstrometrySettings-Longitude', longitude.value);
      await apiService.profileChangeValue('AstrometrySettings-Elevation', altitude.value);
      await apiService.profileChangeValue('TelescopeSettings-TelescopeLocationSyncDirection', 2);

      if (store.mountInfo.Connected) {
        await apiService.mountAction('disconnect');
        await apiService.mountAction('connect');
      }
      settingsStore.setCoordinates({
        latitude: latitude.value,
        longitude: longitude.value,
        altitude: altitude.value,
      });
      console.log('Coordinates saved');
    } catch (error) {
      console.error('Failed to update backend coordinates:', error);
    }
  }
}

function showTutorial() {
  showTutorialModal.value = true;
  settingsStore.resetTutorial();
}

function closeTutorial() {
  showTutorialModal.value = false;
  settingsStore.completeTutorial();
}

// Confirmation modal logic
const confirmAction = ref(null);

function cancelConfirmation() {
  confirmAction.value = null;
}

function performRestart() {
  router.push('/');
  store.showSettings = false;
  store.isBackendReachable = false;
  apiService.restart();
}

function performShutdown() {
  router.push('/');
  store.showSettings = false;
  store.isBackendReachable = false;
  apiService.shutdown();
}

function confirmActionHandler() {
  if (confirmAction.value === 'restart') {
    performRestart();
  } else if (confirmAction.value === 'shutdown') {
    performShutdown();
  }
  confirmAction.value = null;
}

function restartSystem() {
  confirmAction.value = 'restart';
}

function shutdownSystem() {
  confirmAction.value = 'shutdown';
}
</script>
