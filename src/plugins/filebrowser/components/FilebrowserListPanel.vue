<template>
  <div class="border-b lg:border-b-0 lg:border-r border-line">
    <div
      v-if="isLoading"
      class="h-full min-h-[260px] flex items-center justify-center text-content-muted"
    >
      {{ $t('plugins.filebrowser.loading') }}
    </div>

    <div
      v-else-if="errorMessage"
      class="h-full min-h-[260px] flex items-center justify-center px-4 text-center text-status-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-else-if="!directories.length && !files.length"
      class="h-full min-h-[260px] flex items-center justify-center px-4 text-center text-content-faint"
    >
      {{ isFiltered ? $t('plugins.filebrowser.noMatches') : $t('plugins.filebrowser.empty') }}
    </div>

    <ul v-else class="divide-y divide-line">
      <li
        v-for="dir in directories"
        :key="dir.path"
        class="flex items-center gap-1"
        :class="isSelected(dir.path) ? 'bg-accent/10' : 'hover:bg-surface-2'"
      >
        <button
          type="button"
          class="min-h-touch min-w-touch flex items-center justify-center shrink-0"
          :aria-label="$t('plugins.filebrowser.toggleSelection', { name: dir.name })"
          :aria-pressed="isSelected(dir.path)"
          @click="$emit('toggle-selection', dir, 'directory')"
        >
          <span
            class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
            :class="
              isSelected(dir.path)
                ? 'bg-accent-action border-accent-action'
                : 'border-line-strong bg-surface-2'
            "
          >
            <svg
              v-if="isSelected(dir.path)"
              class="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 min-h-touch text-left"
          @click="$emit('open-directory', dir)"
        >
          <svg class="h-5 w-5 text-status-warn shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-content">{{ dir.name }}</span>
            <span class="block text-xs text-content-faint">
              {{ formatDateTime(dir.lastModified) }}
            </span>
          </span>
          <svg
            class="h-4 w-4 shrink-0 text-content-faint"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </li>

      <li
        v-for="file in files"
        :key="file.path"
        class="flex items-center gap-1"
        :class="isSelected(file.path) ? 'bg-accent/10' : 'hover:bg-surface-2'"
      >
        <button
          type="button"
          class="min-h-touch min-w-touch flex items-center justify-center shrink-0"
          :aria-label="$t('plugins.filebrowser.toggleSelection', { name: file.name })"
          :aria-pressed="isSelected(file.path)"
          @click="$emit('toggle-selection', file, 'file')"
        >
          <span
            class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
            :class="
              isSelected(file.path)
                ? 'bg-accent-action border-accent-action'
                : 'border-line-strong bg-surface-2'
            "
          >
            <svg
              v-if="isSelected(file.path)"
              class="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 min-h-touch text-left"
          @click="$emit('toggle-selection', file, 'file')"
        >
          <svg
            class="h-5 w-5 text-content-faint shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-content">{{ file.name }}</span>
            <span class="block text-xs text-content-faint">
              {{ formatSize(file.size) }} · {{ formatDateTime(file.lastModified) }}
            </span>
          </span>
          <span
            class="shrink-0 text-[10px] px-2 py-0.5 rounded-chip bg-surface-3 text-content-muted uppercase"
          >
            {{ getFileExtension(file.name) || 'file' }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  isFiltered: { type: Boolean, default: false },
  directories: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  isSelected: { type: Function, required: true },
  formatSize: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  getFileExtension: { type: Function, required: true },
});

defineEmits(['open-directory', 'toggle-selection']);
</script>
