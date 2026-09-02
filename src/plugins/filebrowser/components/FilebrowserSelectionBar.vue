<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-150 ease-out"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="selectionCount > 0 || downloadProgress.active"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1/95 pb-[env(safe-area-inset-bottom)]"
      >
        <div v-if="downloadProgress.active" class="px-4 pt-3">
          <div class="flex items-center gap-3 text-xs text-content-muted">
            <span class="shrink-0">
              {{
                $t('plugins.filebrowser.download.progress', {
                  current: downloadProgress.currentIndex,
                  total: downloadProgress.total,
                })
              }}
            </span>
            <span class="min-w-0 flex-1 truncate">{{ downloadProgress.currentName }}</span>
            <button type="button" class="shrink-0 text-status-danger" @click="$emit('cancel')">
              {{ $t('common.cancel') }}
            </button>
          </div>
          <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              class="h-full bg-accent transition-[width] duration-150"
              :style="{ width: `${downloadProgress.percent}%` }"
            />
          </div>
        </div>

        <div v-if="selectionCount > 0" class="flex items-center gap-2 px-3 py-2">
          <span class="shrink-0 text-sm font-semibold text-content tabular-nums">
            {{ $t('plugins.filebrowser.selectedCount', { count: selectionCount }) }}
          </span>

          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="tns-btn-secondary w-auto px-3"
              :disabled="!canOpen || downloadProgress.active"
              :title="$t('plugins.filebrowser.openFolder')"
              @click="$emit('open')"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M21 14v7h-7" />
                <path d="M3 10v11h11" />
              </svg>
              <span class="hidden sm:inline">{{ $t('plugins.filebrowser.openFolder') }}</span>
            </button>

            <button
              type="button"
              class="tns-btn-secondary w-auto px-3"
              :disabled="!canDownload || downloadProgress.active"
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
              <span class="hidden sm:inline">{{ $t('plugins.filebrowser.download.action') }}</span>
            </button>

            <button
              type="button"
              class="tns-btn-secondary w-auto px-3"
              :disabled="!canRename || downloadProgress.active"
              :title="$t('common.edit')"
              @click="$emit('rename')"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              <span class="hidden sm:inline">{{ $t('common.edit') }}</span>
            </button>

            <button
              type="button"
              class="tns-btn-danger w-auto px-3"
              :disabled="downloadProgress.active"
              :title="$t('common.delete')"
              @click="$emit('delete')"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              <span class="hidden sm:inline">{{ $t('common.delete') }}</span>
            </button>

            <button
              type="button"
              class="tns-btn-secondary w-auto px-3"
              :title="$t('plugins.filebrowser.clearSelection')"
              @click="$emit('clear')"
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  selectionCount: { type: Number, default: 0 },
  canOpen: { type: Boolean, default: false },
  canRename: { type: Boolean, default: false },
  canDownload: { type: Boolean, default: false },
  downloadProgress: { type: Object, required: true },
});

defineEmits(['open', 'download', 'rename', 'delete', 'clear', 'cancel']);
</script>
