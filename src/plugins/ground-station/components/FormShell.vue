<template>
  <div class="space-y-5">
    <!-- Loading skeleton -->
    <div
      v-if="store.loading[serviceId] && !store.settings[serviceId]"
      class="text-gray-400 text-sm"
    >
      {{ $t('plugins.groundStation.common.loading') }}
    </div>

    <!-- Form content -->
    <div v-else>
      <slot />
    </div>

    <!-- Error -->
    <div
      v-if="store.errors[serviceId]"
      class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      {{ store.errors[serviceId] }}
    </div>

    <!-- Test status -->
    <div
      v-if="store.testStatus[serviceId]"
      :class="[
        'rounded-lg border px-4 py-3 text-sm',
        store.testStatus[serviceId].ok
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/40 bg-red-500/10 text-red-200',
      ]"
    >
      {{
        store.testStatus[serviceId].ok
          ? $t('plugins.groundStation.common.testSuccess')
          : $t('plugins.groundStation.common.testFailed')
      }}
      <span v-if="store.testStatus[serviceId].message" class="opacity-80">
        — {{ store.testStatus[serviceId].message }}
      </span>
    </div>

    <!-- Action buttons -->
    <div v-if="store.settings[serviceId]" class="flex flex-wrap gap-3 pt-2">
      <button
        type="button"
        @click="$emit('save')"
        :disabled="store.saving[serviceId]"
        class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{
          store.saving[serviceId]
            ? $t('plugins.groundStation.common.saving')
            : $t('plugins.groundStation.common.save')
        }}
      </button>
      <button
        v-if="!hideTest"
        type="button"
        @click="$emit('test')"
        :disabled="store.testing[serviceId]"
        class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
      >
        {{
          store.testing[serviceId]
            ? $t('plugins.groundStation.common.testing')
            : $t('plugins.groundStation.common.test')
        }}
      </button>
      <slot name="extra-actions" />
    </div>
  </div>
</template>

<script setup>
import { useGroundStationStore } from '../store/groundStationStore';

defineProps({
  serviceId: { type: String, required: true },
  hideTest: { type: Boolean, default: false },
});
defineEmits(['save', 'test']);

const store = useGroundStationStore();
</script>
