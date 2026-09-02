<template>
  <div class="p-4 flex flex-col gap-4 bg-surface-1/40">
    <h3 class="text-sm font-semibold text-content">
      {{ $t('plugins.filebrowser.details') }}
    </h3>

    <div
      v-if="selectionCount > 1"
      class="rounded-control border border-line bg-surface-2 p-3 text-sm text-content-muted"
    >
      {{ $t('plugins.filebrowser.selectedCount', { count: selectionCount }) }}
    </div>

    <template v-else-if="selectedEntry">
      <div class="rounded-control border border-line bg-surface-2 p-3 text-sm">
        <p class="text-content break-all font-medium">{{ selectedEntry.name }}</p>
        <p class="text-xs text-content-faint mt-1 break-all">{{ selectedEntry.path }}</p>

        <div class="mt-3 grid grid-cols-1 gap-2 text-xs text-content-muted">
          <div>
            <span class="text-content-faint">{{ $t('plugins.filebrowser.type') }}:</span>
            <span class="ml-2 text-content">{{ selectedEntryTypeLabel }}</span>
          </div>
          <div v-if="selectedEntryType === 'file'">
            <span class="text-content-faint">{{ $t('plugins.filebrowser.size') }}:</span>
            <span class="ml-2 text-content">{{ formatSize(selectedEntry.size) }}</span>
          </div>
          <div>
            <span class="text-content-faint">{{ $t('plugins.filebrowser.modified') }}:</span>
            <span class="ml-2 text-content">{{ formatDateTime(selectedEntry.lastModified) }}</span>
          </div>
          <div v-if="selectedEntryType === 'file'">
            <span class="text-content-faint">{{ $t('plugins.filebrowser.isImage') }}:</span>
            <span class="ml-2" :class="isSelectedEntryImage ? 'text-status-ok' : 'text-content'">
              {{ isSelectedEntryImage ? $t('general.yes') : $t('general.no') }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <button
          v-if="selectedEntryType === 'file'"
          type="button"
          class="tns-btn-secondary"
          @click="$emit('open-file', selectedEntry)"
        >
          {{ $t('plugins.filebrowser.openFolder') }}
        </button>
        <button
          v-if="selectedEntryType === 'file'"
          type="button"
          class="tns-btn-secondary"
          :disabled="isDownloading"
          @click="$emit('download-entry', selectedEntry)"
        >
          {{ $t('plugins.filebrowser.download.action') }}
        </button>
        <button
          type="button"
          class="tns-btn-secondary"
          @click="$emit('rename-entry', selectedEntry, selectedEntryType)"
        >
          {{ $t('common.edit') }}
        </button>
      </div>
    </template>

    <div
      v-else
      class="rounded-control border border-dashed border-line p-4 text-sm text-content-faint"
    >
      {{ $t('plugins.filebrowser.selectEntryHint') }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedEntry: { type: Object, default: null },
  selectedEntryType: { type: String, default: null },
  selectedEntryTypeLabel: { type: String, default: '—' },
  isSelectedEntryImage: { type: Boolean, default: false },
  selectionCount: { type: Number, default: 0 },
  isDownloading: { type: Boolean, default: false },
  formatSize: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
});

defineEmits(['open-file', 'rename-entry', 'download-entry']);
</script>
