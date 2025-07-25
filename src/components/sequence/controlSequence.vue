<template>
  <div class="w-full mb-6 z-10">
    <div
      class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700 w-full"
    >
      <h3 class="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6 text-blue-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        {{ $t('components.sequence.sequence_control') }}
      </h3>

      <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          :class="[
            'default-button-blue',
            sequenceStore.sequenceRunning
              ? 'opacity-75 cursor-not-allowed'
              : 'hover:from-blue-700 hover:to-blue-600',
          ]"
          @click="startSequence"
          :disabled="sequenceStore.sequenceRunning"
          v-tooltip="'Start the imaging sequence'"
        >
          <span v-if="sequenceStore.sequenceRunning" class="animate-spin mr-2">&#9696;</span>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
          {{
            sequenceStore.sequenceRunning
              ? $t('components.sequence.running')
              : $t('components.sequence.startSequence')
          }}
        </button>

        <button
          class="default-button-red"
          @click="stopSequence"
          v-tooltip="'Stop the current sequence'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clip-rule="evenodd"
            />
          </svg>
          {{ $t('components.sequence.stopSequence') }}
        </button>

        <button
          class="default-button-orange"
          @click="showResetConfirmation = true"
          :disabled="sequenceStore.sequenceRunning"
          v-tooltip="'Reset sequence state'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd"
            />
          </svg>
          {{ $t('components.sequence.resetSequence') }}
        </button>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <transition name="fade">
      <div
        v-if="showResetConfirmation"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
        @click.self="showResetConfirmation = false"
        @keydown.esc="showResetConfirmation = false"
      >
        <transition name="scale">
          <div v-if="showResetConfirmation" class="bg-gray-800 rounded-lg p-6 max-w-md w-full mt-4">
            <h3 class="text-xl font-semibold mb-4">
              {{ $t('components.sequence.resetConfirmationTitle') }}
            </h3>
            <p class="mb-6">{{ $t('components.sequence.resetConfirmationMessage') }}</p>
            <div class="flex justify-end space-x-4">
              <button class="btn-secondary" @click="showResetConfirmation = false">
                {{ $t('general.cancel') }}
              </button>
              <button class="btn-danger" @click="confirmReset">
                {{ $t('general.confirm') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';

const sequenceStore = useSequenceStore();
const showResetConfirmation = ref(false);
const isLoading = computed(() => sequenceStore.sequenceRunning);

async function startSequence() {
  console.log('Starting sequence');
  sequenceStore.setSequenceRunning(true);
  try {
    const data = await apiService.sequenceAction('start');
    console.log('Antwort:', data);
    await sequenceStore.getSequenceInfo();
  } catch (error) {
    console.log('Fehler:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function stopSequence() {
  try {
    const data = await apiService.sequenceAction('stop');
    console.log('Antwort:', data);

    // Only stop if the API confirms success
    if (data.Success) {
      await sequenceStore.getSequenceInfo();
      sequenceStore.setSequenceRunning(false);
    } else {
      console.error('Failed to stop sequence:', data.Error);
    }
  } catch (error) {
    console.log('Fehler:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function confirmReset() {
  isLoading.value = true;
  showResetConfirmation.value = false;
  try {
    // Use the store's resetSequence method which handles notifications
    const success = await sequenceStore.resetSequence();

    if (success) {
      // Reset successful
      await sequenceStore.getSequenceInfo();
      isLoading.value = false;
    } else {
      console.error('Failed to reset sequence');
      // Allow retry on error
      isLoading.value = false;
    }
  } catch (error) {
    console.log('Fehler:', error);
    // Allow retry on error
    isLoading.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
