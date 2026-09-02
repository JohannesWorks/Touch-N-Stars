<template>
  <div class="border-b border-line p-3 sm:p-4 flex flex-col gap-3">
    <div
      class="overflow-x-auto scrollbar-thin px-3 py-2 rounded-control border border-line bg-surface-2"
    >
      <span
        class="text-sm font-mono whitespace-nowrap"
        :class="currentPath ? 'text-content' : 'text-content-faint italic'"
      >
        {{ currentPath || $t('components.settings.imageSavePath.placeholder') }}
      </span>
    </div>

    <div v-if="breadcrumbs.length" class="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
      <button
        v-for="(crumb, idx) in breadcrumbs"
        :key="crumb.path"
        type="button"
        class="rounded-chip px-2 py-1 transition-colors"
        :class="
          idx === breadcrumbs.length - 1
            ? 'bg-surface-3 text-content cursor-default'
            : 'text-accent hover:bg-surface-2'
        "
        :disabled="idx === breadcrumbs.length - 1"
        @click="$emit('browse', crumb.path)"
      >
        {{ crumb.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        type="button"
        class="tns-btn-secondary"
        :disabled="isLoading"
        @click="$emit('jump-to-image-path')"
      >
        {{ $t('plugins.filebrowser.jumpToImagePath') }}
      </button>
      <button
        type="button"
        class="tns-btn-secondary"
        :disabled="!canGoUp || isLoading"
        @click="$emit('go-up')"
      >
        {{ $t('plugins.filebrowser.goUp') }}
      </button>
      <button
        type="button"
        class="tns-btn-secondary col-span-2 sm:col-span-1"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        {{ $t('plugins.filebrowser.refresh') }}
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="searchModel"
        type="search"
        class="tns-input flex-1"
        :placeholder="$t('plugins.filebrowser.searchPlaceholder')"
      />
      <div class="flex gap-2">
        <select v-model="sortKeyModel" class="tns-select flex-1 sm:w-44" :aria-label="sortByLabel">
          <option value="name">{{ $t('plugins.filebrowser.sortName') }}</option>
          <option value="modified">{{ $t('plugins.filebrowser.sortModified') }}</option>
          <option value="size">{{ $t('plugins.filebrowser.sortSize') }}</option>
        </select>
        <button
          type="button"
          class="tns-btn-secondary w-auto px-3 shrink-0"
          :title="
            sortDir === 'asc'
              ? $t('plugins.filebrowser.sortAsc')
              : $t('plugins.filebrowser.sortDesc')
          "
          @click="$emit('toggle-sort-dir')"
        >
          <svg
            class="w-5 h-5 transition-transform"
            :class="sortDir === 'desc' ? 'rotate-180' : ''"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 20V4" />
            <path d="M6 10l6-6 6 6" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-sm text-content-muted min-h-touch cursor-pointer">
        <input
          v-model="imagesOnlyModel"
          type="checkbox"
          class="h-5 w-5 rounded border-line-strong bg-surface-2 text-accent-action"
        />
        <span>{{ $t('plugins.filebrowser.imagesOnly') }}</span>
      </label>

      <button
        type="button"
        class="ml-auto text-sm text-accent px-2 min-h-touch"
        :disabled="isLoading || (!directoriesCount && !filesCount)"
        @click="$emit('select-all')"
      >
        {{ $t('plugins.filebrowser.selectAll') }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="px-2 py-1 rounded-chip bg-surface-3 text-content-muted">
        {{ $t('plugins.filebrowser.directoriesCount', { count: directoriesCount }) }}
      </span>
      <span class="px-2 py-1 rounded-chip bg-surface-3 text-content-muted">
        {{ $t('plugins.filebrowser.filesCount', { count: filesCount }) }}
      </span>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="newFolderNameModel"
        class="tns-input flex-1"
        :placeholder="$t('plugins.filebrowser.newFolderPlaceholder')"
        @keydown.enter="$emit('create-directory')"
      />
      <button
        type="button"
        class="tns-btn-secondary sm:w-auto sm:px-4 shrink-0"
        :disabled="isLoading || !newFolderName.trim()"
        @click="$emit('create-directory')"
      >
        {{ $t('plugins.filebrowser.createFolder') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  currentPath: { type: String, default: '' },
  canGoUp: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  showImagesOnly: { type: Boolean, default: true },
  searchQuery: { type: String, default: '' },
  sortKey: { type: String, default: 'name' },
  sortDir: { type: String, default: 'asc' },
  directoriesCount: { type: Number, default: 0 },
  filesCount: { type: Number, default: 0 },
  newFolderName: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'jump-to-image-path',
  'go-up',
  'refresh',
  'create-directory',
  'browse',
  'select-all',
  'toggle-sort-dir',
  'update:showImagesOnly',
  'update:newFolderName',
  'update:searchQuery',
  'update:sortKey',
]);

const { t } = useI18n();

const sortByLabel = computed(() => t('plugins.filebrowser.sortBy'));

function model(prop, event) {
  return computed({
    get: () => props[prop],
    set: (value) => emit(event, value),
  });
}

const imagesOnlyModel = model('showImagesOnly', 'update:showImagesOnly');
const newFolderNameModel = model('newFolderName', 'update:newFolderName');
const searchModel = model('searchQuery', 'update:searchQuery');
const sortKeyModel = model('sortKey', 'update:sortKey');
</script>
