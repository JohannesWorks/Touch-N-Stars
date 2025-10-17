<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
  >
    <div class="bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-700">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <svg
            class="w-10 h-10 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-white text-center">{{ title }}</h3>

      <!-- Message -->
      <p class="text-gray-300 text-center">{{ message }}</p>

      <!-- Permission Details (if showing details) -->
      <div v-if="showDetails" class="bg-gray-900 rounded-lg p-4 space-y-2">
        <div v-if="permissionType === 'camera'" class="flex items-center gap-2 text-sm text-gray-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ $t('permissions.camera.description') }}</span>
        </div>

        <div v-if="permissionType === 'location'" class="flex items-center gap-2 text-sm text-gray-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ $t('permissions.location.description') }}</span>
        </div>

        <div v-if="permissionType === 'notifications'" class="flex items-center gap-2 text-sm text-gray-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span>{{ $t('permissions.notifications.description') }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          v-if="showCancel"
          @click="handleCancel"
          class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          {{ $t('common.cancel') }}
        </button>

        <button
          v-if="isDenied"
          @click="handleOpenSettings"
          class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          {{ $t('permissions.open_settings') }}
        </button>

        <button
          v-else
          @click="handleConfirm"
          class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  permissionType: {
    type: String, // 'camera' | 'location' | 'notifications'
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  isDenied: {
    type: Boolean,
    default: false,
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  confirmText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['confirm', 'cancel', 'openSettings']);

const computedConfirmText = computed(() => {
  return props.confirmText || t('permissions.grant');
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};

const handleOpenSettings = () => {
  emit('openSettings');
};
</script>
