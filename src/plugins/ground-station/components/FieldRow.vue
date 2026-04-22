<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-300">
      {{ label }}
      <span v-if="hint" class="block text-xs font-normal text-gray-500 mt-0.5">{{ hint }}</span>
    </label>
    <slot :inputId="inputId" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  id: { type: String, default: '' },
});

const _autoId = `gs-field-${Math.random().toString(36).slice(2, 9)}`;
const inputId = computed(() => props.id || _autoId);
</script>
