<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-top bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-md bg-surface-1 border border-line rounded-card overflow-hidden shadow-xl"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-line">
          <p class="text-sm font-semibold text-content">{{ title }}</p>
          <button
            class="text-content-faint text-sm px-2 py-1 rounded-chip hover:text-content hover:bg-surface-3 transition-colors"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="p-4 flex flex-col gap-3">
          <label class="text-xs text-content-muted">{{ $t('common.name') }}</label>
          <input
            ref="renameInput"
            v-model="inputModel"
            type="text"
            class="tns-input"
            @keydown.enter="$emit('confirm')"
            @keydown.esc="$emit('close')"
          />
          <p v-if="error" class="text-xs text-status-danger">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-2 px-4 py-3 border-t border-line">
          <button class="tns-btn-secondary" @click="$emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button class="tns-btn-primary" :disabled="!inputValue.trim()" @click="$emit('confirm')">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  error: { type: String, default: '' },
  inputValue: { type: String, default: '' },
});

const emit = defineEmits(['close', 'confirm', 'update:inputValue']);

const renameInput = ref(null);

const inputModel = computed({
  get: () => props.inputValue,
  set: (value) => emit('update:inputValue', value),
});

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }

    await nextTick();
    renameInput.value?.focus();
    renameInput.value?.select();
  }
);
</script>
