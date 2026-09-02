<template>
  <div class="sequence-editor h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Loading Spinner during initialization -->
    <div v-if="isInitializing" class="flex flex-col items-center justify-center py-20">
      <svg class="w-12 h-12 animate-spin text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-gray-400 text-center">{{ t('plugins.common.initializing') }}</p>
    </div>

    <!-- Outdated Plugin Version Message -->
    <div v-else-if="isPluginOutdated" class="flex flex-col items-center justify-center py-20">
      <div
        class="border border-red-700 rounded-lg bg-gradient-to-br from-red-900/30 to-red-800/30 shadow-lg p-8 max-w-md mx-auto text-center"
      >
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <h3 class="text-xl font-bold text-red-400 mb-4">
          {{ t('plugins.common.outdated.title') }}
        </h3>
        <p class="text-gray-300 mb-4">
          {{ t('plugins.common.outdated.message', { host: mainStore.isPINS ? 'PINS' : 'NINA' }) }}
        </p>
        <p class="text-sm text-gray-400">{{ t('plugins.common.outdated.required') }}: v1.1.3.0</p>
        <p class="text-sm text-gray-400">
          {{ t('plugins.common.outdated.current') }}: {{ mainStore.currentTnsPluginVersion }}
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="h-full flex flex-col">
      <!-- Header -->
      <div
        class="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('plugins.sequenceCreator.title') }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ t('plugins.sequenceCreator.subtitle') }}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Undo/Redo -->
            <button
              @click="store.undo()"
              :disabled="!store.canUndo"
              class="tns-btn-secondary h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.undo')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                t('plugins.sequenceCreator.toolbar.undo')
              }}</span>
            </button>

            <button
              @click="store.redo()"
              :disabled="!store.canRedo"
              class="tns-btn-secondary h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.redo')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                t('plugins.sequenceCreator.toolbar.redo')
              }}</span>
            </button>

            <!-- Save Named -->
            <button
              @click="handleSaveNamed"
              class="tns-btn-secondary h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.saveNamed')"
            >
              <!-- Floppy disk icon -->
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <!-- outer body with notched top-left corner -->
                <path d="M6 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8l3-5z" />
                <!-- label area (recessed rectangle, top-right) -->
                <rect x="8" y="3" width="9" height="6" rx="0.5" />
                <!-- metal slide at the bottom -->
                <rect x="8" y="15" width="8" height="5" rx="1" />
                <!-- write-protect notch line on label -->
                <line x1="15" y1="3" x2="15" y2="9" />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                t('plugins.sequenceCreator.toolbar.saveNamed')
              }}</span>
            </button>

            <!-- Open Library -->
            <button
              @click="handleOpenLibrary"
              class="tns-btn-secondary h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.openLibrary')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                t('plugins.sequenceCreator.toolbar.openLibrary')
              }}</span>
            </button>

            <!-- Clear All -->
            <button
              @click="handleClearSequence"
              class="tns-btn-danger h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.clearSequence')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                t('plugins.sequenceCreator.toolbar.clearSequence')
              }}</span>
            </button>

            <!-- Send to Nina -->
            <button
              @click="sendToNina"
              :disabled="!store.sequenceIsValid || isSendingToNina"
              class="tns-btn-primary h-16 w-14 flex-col gap-0.5"
              :title="t('plugins.sequenceCreator.toolbar.sendToNina')"
            >
              <svg
                v-if="isSendingToNina"
                class="w-6 h-6 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span class="text-[9px] leading-none font-medium">{{
                isSendingToNina
                  ? t('plugins.sequenceCreator.toolbar.sending')
                  : t('plugins.sequenceCreator.toolbar.sendToNina')
              }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto">
          <!-- Sequence Builder -->
          <div class="p-4">
            <div class="max-w-4xl mx-auto space-y-6">
              <!-- Sequence Validation Status -->
              <div class="mb-6">
                <div
                  v-if="store.sequenceIsValid"
                  class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-green-800 dark:text-green-200 font-medium">
                    {{ t('plugins.sequenceCreator.toolbar.validSequence') }}
                  </span>
                </div>
                <div
                  v-else
                  class="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span class="text-yellow-800 dark:text-yellow-200">
                    {{ t('plugins.sequenceCreator.toolbar.invalidSequence') }}
                  </span>
                </div>
              </div>

              <!-- Sequence Settings -->
              <div class="mb-6">
                <div
                  class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    {{ t('plugins.sequenceCreator.settings.title') }}
                  </h3>
                  <div class="flex items-center">
                    <input
                      id="meridian-flip-enabled"
                      type="checkbox"
                      v-model="store.enableMeridianFlip"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      for="meridian-flip-enabled"
                      class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {{ t('plugins.sequenceCreator.settings.enableMeridianFlip') }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Start Container -->
              <SequenceContainer
                :title="t('plugins.sequenceCreator.containers.startSequence.title')"
                :description="t('plugins.sequenceCreator.containers.startSequence.description')"
                :actions="store.startSequence"
                container-type="start"
                icon="rocket"
                color="blue"
                @add-action="handleAddAction"
                @remove-action="handleRemoveAction"
                @duplicate-action="handleDuplicateAction"
                @move-action="handleMoveAction"
              />

              <!-- Target Container -->
              <SequenceContainer
                :title="t('plugins.sequenceCreator.containers.targetSequence.title')"
                :description="t('plugins.sequenceCreator.containers.targetSequence.description')"
                :actions="store.targetSequence"
                container-type="target"
                icon="crosshairs"
                color="green"
                @add-action="handleAddAction"
                @remove-action="handleRemoveAction"
                @duplicate-action="handleDuplicateAction"
                @move-action="handleMoveAction"
              />

              <!-- End Container -->
              <SequenceContainer
                :title="t('plugins.sequenceCreator.containers.endSequence.title')"
                :description="t('plugins.sequenceCreator.containers.endSequence.description')"
                :actions="store.endSequence"
                container-type="end"
                icon="flag"
                color="red"
                @add-action="handleAddAction"
                @remove-action="handleRemoveAction"
                @duplicate-action="handleDuplicateAction"
                @move-action="handleMoveAction"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Sequence Confirmation Modal -->
    <Modal :show="showClearModal" @close="cancelClear">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.title') }}
        </h2>
      </template>
      <template #body>
        <div class="text-center">
          <p class="text-gray-300 mb-6">
            {{ t('plugins.sequenceCreator.confirmations.clearSequence') }}
          </p>
          <div class="flex justify-center gap-4">
            <button @click="cancelClear" class="tns-btn-secondary text-sm">
              {{ t('general.cancel') }}
            </button>
            <button @click="confirmClear" class="tns-btn-danger text-sm">
              {{ t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Navigate to Sequence Page Confirmation Modal -->
    <Modal :show="showNavigateModal" @close="cancelNavigate">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.title') }}
        </h2>
      </template>
      <template #body>
        <div class="text-center">
          <p class="text-gray-300 mb-6">
            {{ t('plugins.sequenceCreator.confirmations.navigateToSequence') }}
          </p>
          <div class="flex justify-center gap-4">
            <button @click="cancelNavigate" class="tns-btn-secondary text-sm">
              {{ t('general.cancel') }}
            </button>
            <button @click="confirmNavigate" class="tns-btn-primary text-sm">
              {{ t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Save Named Sequence Modal -->
    <Modal :show="showSaveNamedModal" @close="cancelSaveNamed">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.toolbar.saveNamed') }}
        </h2>
      </template>
      <template #body>
        <div>
          <p class="text-gray-300 mb-3">
            {{ t('plugins.sequenceCreator.confirmations.saveNamed') }}
          </p>
          <input
            v-model="saveNamedInput"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 mb-6"
            :placeholder="t('plugins.sequenceCreator.confirmations.saveNamedPlaceholder')"
            @keyup.enter="saveNamedInput.trim() && confirmSaveNamed()"
          />
          <div class="flex justify-center gap-4">
            <button @click="cancelSaveNamed" class="tns-btn-secondary text-sm">
              {{ t('general.cancel') }}
            </button>
            <button
              @click="confirmSaveNamed"
              :disabled="!saveNamedInput.trim() || isSavingNamed"
              class="tns-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Sequence Library Modal -->
    <Modal :show="showLibraryModal" @close="closeLibrary">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.libraryTitle') }}
        </h2>
      </template>
      <template #body>
        <div>
          <div v-if="isLoadingLibrary" class="flex justify-center py-8">
            <svg class="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div v-else-if="store.savedSequencesList.length === 0" class="text-center py-8">
            <p class="text-gray-400">
              {{ t('plugins.sequenceCreator.confirmations.libraryEmpty') }}
            </p>
          </div>
          <ul v-else class="space-y-2 max-h-80 overflow-y-auto mb-4">
            <li
              v-for="seq in store.savedSequencesList"
              :key="seq.key"
              :class="[
                'flex items-center justify-between gap-3 p-3 rounded-lg',
                store.defaultSequenceKey === seq.key
                  ? 'bg-blue-900/40 border border-blue-600/50'
                  : 'bg-gray-700',
              ]"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-white font-medium truncate">{{ seq.name }}</p>
                  <span
                    v-if="store.defaultSequenceKey === seq.key"
                    class="shrink-0 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium"
                  >
                    {{ t('plugins.sequenceCreator.library.isDefault') }}
                  </span>
                </div>
                <p v-if="seq.createdAt" class="text-xs text-gray-400">
                  {{ new Date(seq.createdAt).toLocaleString() }}
                </p>
              </div>
              <div v-if="libraryDeleteConfirmKey === seq.key" class="flex gap-2 shrink-0">
                <button
                  @click="libraryDeleteConfirmKey = null"
                  class="tns-btn-secondary text-xs px-2 py-1"
                >
                  {{ t('general.cancel') }}
                </button>
                <button
                  @click="confirmDeleteNamed(seq.key)"
                  class="tns-btn-danger text-xs px-2 py-1"
                >
                  {{ t('general.confirm') }}
                </button>
              </div>
              <div v-else class="flex gap-2 shrink-0">
                <button
                  v-if="store.defaultSequenceKey !== seq.key"
                  @click="handleSetAsDefault(seq.key)"
                  class="tns-btn-secondary text-xs px-2 py-1"
                >
                  {{ t('plugins.sequenceCreator.library.setAsDefault') }}
                </button>
                <button
                  @click="handleLoadNamedSequence(seq.key)"
                  class="tns-btn-secondary text-xs px-2 py-1"
                >
                  {{ t('plugins.sequenceCreator.toolbar.loadNamed') }}
                </button>
                <button
                  @click="libraryDeleteConfirmKey = seq.key"
                  class="tns-btn-danger text-xs px-2 py-1"
                >
                  {{ t('general.delete') }}
                </button>
              </div>
            </li>
          </ul>
          <div class="flex justify-end">
            <button @click="closeLibrary" class="tns-btn-secondary text-sm">
              {{ t('general.close') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useSequenceStore } from '../stores/sequenceStore.js';
import { useToastStore } from '@/store/toastStore.js';
import { apiStore } from '@/store/store.js';
import SequenceContainer from './SequenceContainer.vue';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService.js';

const { t } = useI18n();
const router = useRouter();
const store = useSequenceStore();
const toastStore = useToastStore();
const mainStore = apiStore();

const showClearModal = ref(false);
const showNavigateModal = ref(false);
const showSaveNamedModal = ref(false);
const saveNamedInput = ref('');
const isSavingNamed = ref(false);
const showLibraryModal = ref(false);
const isLoadingLibrary = ref(false);
const libraryDeleteConfirmKey = ref(null);

// Version checking states
const isInitializing = ref(true);
const isPluginOutdated = ref(false);

// Send to Nina states
const isSendingToNina = ref(false);

function handleAddAction(template, containerType, index = null) {
  store.addAction(template, containerType, index);
}

function handleRemoveAction(actionId, containerType) {
  store.removeAction(actionId, containerType);
}

function handleDuplicateAction(actionId, containerType) {
  store.duplicateAction(actionId, containerType);
}

function handleMoveAction(oldIndex, newIndex, containerType) {
  store.moveAction(oldIndex, newIndex, containerType);
}

function handleClearSequence() {
  showClearModal.value = true;
}

function confirmClear() {
  store.clearSequence();
  showClearModal.value = false;
}

function cancelClear() {
  showClearModal.value = false;
}

function confirmNavigate() {
  showNavigateModal.value = false;
  router.push('/sequence');
}

function cancelNavigate() {
  showNavigateModal.value = false;
}

function handleSaveNamed() {
  saveNamedInput.value = '';
  showSaveNamedModal.value = true;
}

async function confirmSaveNamed() {
  const name = saveNamedInput.value.trim();
  if (!name) return;
  isSavingNamed.value = true;
  try {
    await store.saveNamedSequence(name);
    showSaveNamedModal.value = false;
    toastStore.showToast({
      type: 'success',
      title: t('plugins.sequenceCreator.toolbar.saveNamed'),
      message: t('plugins.sequenceCreator.toolbar.saveNamedSuccess'),
      autoClose: true,
      autoCloseDelay: 3000,
    });
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.toolbar.saveNamed'),
      message: error.message || 'Error saving sequence',
      autoClose: true,
      autoCloseDelay: 5000,
    });
  } finally {
    isSavingNamed.value = false;
  }
}

function cancelSaveNamed() {
  showSaveNamedModal.value = false;
}

async function handleOpenLibrary() {
  showLibraryModal.value = true;
  libraryDeleteConfirmKey.value = null;
  isLoadingLibrary.value = true;
  try {
    await store.loadSavedSequencesList();
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.confirmations.libraryTitle'),
      message: error.message || 'Error loading library',
      autoClose: true,
      autoCloseDelay: 5000,
    });
  } finally {
    isLoadingLibrary.value = false;
  }
}

function closeLibrary() {
  showLibraryModal.value = false;
  libraryDeleteConfirmKey.value = null;
}

async function handleLoadNamedSequence(key) {
  try {
    await store.loadNamedSequence(key);
    closeLibrary();
    toastStore.showToast({
      type: 'success',
      title: t('plugins.sequenceCreator.toolbar.openLibrary'),
      message: t('plugins.sequenceCreator.toolbar.loadNamedSuccess'),
      autoClose: true,
      autoCloseDelay: 3000,
    });
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.toolbar.openLibrary'),
      message: error.message || 'Error loading sequence',
      autoClose: true,
      autoCloseDelay: 5000,
    });
  }
}

async function handleSetAsDefault(key) {
  try {
    await store.setNamedSequenceAsDefault(key);
    toastStore.showToast({
      type: 'success',
      title: t('plugins.sequenceCreator.confirmations.libraryTitle'),
      message: t('plugins.sequenceCreator.library.setAsDefaultSuccess'),
      autoClose: true,
      autoCloseDelay: 3000,
    });
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.confirmations.libraryTitle'),
      message: error.message || 'Error setting default',
      autoClose: true,
      autoCloseDelay: 5000,
    });
  }
}

async function confirmDeleteNamed(key) {
  try {
    await store.deleteNamedSequence(key);
    libraryDeleteConfirmKey.value = null;
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.confirmations.libraryTitle'),
      message: error.message || 'Error deleting sequence',
      autoClose: true,
      autoCloseDelay: 5000,
    });
  }
}

async function sendToNina() {
  isSendingToNina.value = true;

  try {
    // Send the JSON content to N.I.N.A
    const response = await apiService.sequenceLoadJson(store.ninaSequenceJSON);

    if (response && response.Success !== false) {
      // Show success toast
      toastStore.showToast({
        type: 'success',
        title: t('plugins.sequenceCreator.toolbar.sent'),
        message: t('plugins.sequenceCreator.toolbar.sendSuccessMessage'),
        autoClose: true,
        autoCloseDelay: 1000,
      });
      console.log('Sequence successfully sent to N.I.N.A:', response);

      // Show navigation confirmation modal
      showNavigateModal.value = true;
    } else {
      // Show error toast
      toastStore.showToast({
        type: 'error',
        title: t('plugins.sequenceCreator.toolbar.sendErrorTitle'),
        message: response?.Response || 'Unknown error occurred',
        autoClose: true,
        autoCloseDelay: 5000,
      });
    }
  } catch (error) {
    // Show error toast
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.toolbar.sendErrorTitle'),
      message: error.message || 'Failed to send sequence to N.I.N.A',
      autoClose: true,
      autoCloseDelay: 5000,
    });
    console.error('Error sending sequence to N.I.N.A:', error);
  } finally {
    isSendingToNina.value = false;
  }
}

// Check version and initialize sequence
onMounted(async () => {
  // Check TNS plugin version first
  if (!mainStore.checkVersionNewerOrEqual(mainStore.currentTnsPluginVersion, '1.1.2.0')) {
    console.log('[SequenceCreator] Plugin version is too old', mainStore.currentTnsPluginVersion);
    isPluginOutdated.value = true;
    isInitializing.value = false;
    return;
  }

  // Initialize the localized templates
  store.initializeLocalizedTemplates(t);

  // Check if sequences are empty and load basic sequence
  const isEmpty =
    store.startSequence.length === 0 &&
    store.targetSequence.length === 0 &&
    store.endSequence.length === 0;

  if (isEmpty) {
    await store.loadBasicSequence();
  }

  isInitializing.value = false;
});
</script>

<style scoped>
.sequence-editor {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.animate-fade-in-out {
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, 4px);
  }

  10%,
  90% {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -4px);
  }
}
</style>
