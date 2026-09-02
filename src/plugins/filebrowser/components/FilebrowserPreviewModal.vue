<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-top bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-5xl max-h-[92vh] bg-surface-1 border border-line rounded-card overflow-hidden shadow-xl"
      >
        <div class="flex items-center gap-2 px-3 py-2 border-b border-line">
          <p class="text-sm font-semibold text-content truncate flex-1 min-w-0">{{ fileName }}</p>
          <button
            type="button"
            class="tns-btn-secondary w-auto px-3"
            :disabled="isDownloading"
            :title="$t('plugins.filebrowser.download.action')"
            @click="$emit('download')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 3v12" />
              <path d="M7 12l5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
          </button>
          <button
            type="button"
            class="tns-btn-secondary w-auto px-3"
            :title="$t('common.close')"
            @click="$emit('close')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-3 bg-ground max-h-[calc(92vh-64px)] overflow-auto">
          <div
            v-if="loading"
            class="min-h-[300px] flex flex-col items-center justify-center gap-3 text-sm text-content-muted"
          >
            <div
              class="w-10 h-10 border-4 border-accent-action border-t-transparent border-solid rounded-full animate-spin"
            />
            {{ $t('plugins.filebrowser.loading') }}
          </div>

          <div
            v-else-if="error"
            class="min-h-[300px] flex items-center justify-center text-sm text-status-danger text-center px-4"
          >
            {{ error }}
          </div>

          <div v-else class="relative">
            <div
              v-if="imageLoading"
              class="absolute inset-0 flex items-center justify-center min-h-[300px]"
            >
              <div
                class="w-10 h-10 border-4 border-accent-action border-t-transparent border-solid rounded-full animate-spin"
              />
            </div>
            <img
              :src="url"
              :alt="fileName"
              class="mx-auto max-w-full max-h-[calc(92vh-100px)] object-contain"
              :class="{ invisible: imageLoading }"
              @load="$emit('image-load')"
              @error="$emit('image-error')"
            />
          </div>

          <template v-if="!loading && !error && info">
            <!-- Render controls: this is the part users actually operate. -->
            <div
              class="mt-3 rounded-control border border-line bg-surface-1 p-3 flex flex-col gap-3"
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <span class="text-sm text-content-muted sm:w-44 shrink-0">
                  {{ $t('plugins.filebrowser.fits.stretchStrength') }}
                </span>
                <input
                  :value="localStretchFactor"
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  class="w-full"
                  @input="onStretchFactorInput"
                  @change="commitStretchFactor"
                />
                <span class="text-sm text-content min-w-[48px] text-right tabular-nums">
                  {{ localStretchFactor.toFixed(2) }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <span class="text-sm text-content-muted sm:w-44 shrink-0">
                  {{ $t('plugins.filebrowser.fits.clipStrength') }}
                </span>
                <input
                  :value="localBlackClipping"
                  type="range"
                  min="-5"
                  max="0"
                  step="0.1"
                  class="w-full"
                  @input="onBlackClippingInput"
                  @change="commitBlackClipping"
                />
                <span class="text-sm text-content min-w-[48px] text-right tabular-nums">
                  {{ localBlackClipping.toFixed(1) }}
                </span>
              </div>

              <label
                class="flex items-center gap-3 text-sm text-content min-h-touch cursor-pointer"
              >
                <input
                  v-model="unlinkedModel"
                  type="checkbox"
                  class="h-5 w-5 rounded border-line-strong bg-surface-2 text-accent-action"
                />
                <span>{{ $t('plugins.filebrowser.fits.unlinked') }}</span>
              </label>

              <label
                v-if="info.isBayered"
                class="flex items-center gap-3 text-sm text-content min-h-touch cursor-pointer"
              >
                <input
                  v-model="debayerModel"
                  type="checkbox"
                  class="h-5 w-5 rounded border-line-strong bg-surface-2 text-accent-action"
                />
                <span>{{ $t('plugins.filebrowser.fits.debayer') }}</span>
              </label>
            </div>

            <!-- Diagnostics: collapsed by default, this is developer detail. -->
            <details class="mt-3 rounded-control border border-line bg-surface-1">
              <summary
                class="cursor-pointer px-3 py-3 min-h-touch flex items-center text-sm text-content-muted hover:text-content"
              >
                {{ $t('plugins.filebrowser.fits.debugTitle') }}
              </summary>

              <div
                class="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 pb-3 text-xs text-content-muted"
              >
                <div>
                  <span class="text-content-faint"
                    >{{ $t('plugins.filebrowser.fits.pattern') }}:</span
                  >
                  {{ info.bayerPattern || $t('plugins.filebrowser.fits.none') }}
                </div>
                <div>
                  <span class="text-content-faint"
                    >{{ $t('plugins.filebrowser.fits.bitDepth') }}:</span
                  >
                  {{ info.bitDepth }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.size') }}:</span>
                  {{ info.width }} x {{ info.height }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.stretchStrength') }}:
                  </span>
                  {{ stretchFactor.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.clipStrength') }}:
                  </span>
                  {{ blackClipping.toFixed(1) }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.unlinked') }}:
                  </span>
                  {{ unlinked ? $t('general.yes') : $t('general.no') }}
                </div>
              </div>

              <div v-if="headerEntries.length" class="px-3 pb-3">
                <p class="text-xs text-content-faint mb-1">
                  {{ $t('plugins.filebrowser.fits.header') }}
                </p>
                <div class="max-h-48 overflow-auto rounded-control border border-line bg-surface-2">
                  <div
                    v-for="entry in headerEntries"
                    :key="entry.key"
                    class="grid grid-cols-[120px_1fr] gap-2 px-2 py-1 border-b border-line last:border-b-0 text-xs"
                  >
                    <span class="text-content-faint">{{ entry.key }}</span>
                    <span class="text-content break-all select-text">{{ entry.value }}</span>
                  </div>
                </div>
              </div>
            </details>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  imageLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  url: { type: String, default: '' },
  fileName: { type: String, default: '' },
  isDownloading: { type: Boolean, default: false },
  info: { type: Object, default: null },
  headerEntries: { type: Array, default: () => [] },
  stretchFactor: { type: Number, default: 0.2 },
  blackClipping: { type: Number, default: -2.8 },
  unlinked: { type: Boolean, default: false },
  debayer: { type: Boolean, default: true },
});

const emit = defineEmits([
  'close',
  'download',
  'image-load',
  'image-error',
  'update:stretchFactor',
  'update:blackClipping',
  'update:unlinked',
  'update:debayer',
]);

// The slider commits on 'change' (drag-release), not every 'input' tick - each commit now
// triggers a real network round trip via the parent's debounce, unlike the old canvas
// re-render this replaced.
const localStretchFactor = ref(props.stretchFactor);
const localBlackClipping = ref(props.blackClipping);

watch(
  () => props.stretchFactor,
  (value) => {
    const numeric = Number(value);
    localStretchFactor.value = Number.isFinite(numeric) ? numeric : 0;
  }
);

watch(
  () => props.blackClipping,
  (value) => {
    const numeric = Number(value);
    localBlackClipping.value = Number.isFinite(numeric) ? numeric : 0;
  }
);

function onStretchFactorInput(event) {
  const value = Number(event?.target?.value);
  localStretchFactor.value = Number.isFinite(value) ? value : 0;
}

function commitStretchFactor() {
  emit('update:stretchFactor', localStretchFactor.value);
}

function onBlackClippingInput(event) {
  const value = Number(event?.target?.value);
  localBlackClipping.value = Number.isFinite(value) ? value : 0;
}

function commitBlackClipping() {
  emit('update:blackClipping', localBlackClipping.value);
}

const unlinkedModel = computed({
  get: () => props.unlinked,
  set: (value) => emit('update:unlinked', value),
});

const debayerModel = computed({
  get: () => props.debayer,
  set: (value) => emit('update:debayer', value),
});
</script>
