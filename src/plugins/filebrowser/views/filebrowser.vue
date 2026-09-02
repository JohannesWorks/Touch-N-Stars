<template>
  <div class="container py-4 sm:py-8 px-3 sm:px-4">
    <div class="mx-auto max-w-6xl">
      <div class="mb-4 flex flex-col gap-2">
        <h1 class="text-xl sm:text-2xl font-bold text-content">
          {{ $t('plugins.filebrowser.title') }}
        </h1>
        <p class="text-sm text-content-muted">
          {{ $t('plugins.filebrowser.subtitle') }}
        </p>
      </div>

      <div v-if="!isPluginVersionSupported" class="tns-card p-6 text-center">
        <h3 class="text-lg font-bold text-red-400 mb-2">
          {{ $t('plugins.common.outdated.title') }}
        </h3>
        <p class="text-content-muted mb-3">
          {{ $t('plugins.common.outdated.message', { host: store.isPINS ? 'PINS' : 'NINA' }) }}
        </p>
        <p class="text-sm text-content-muted">
          {{ $t('plugins.common.outdated.required') }}: v{{ MIN_TNS_PLUGIN_VERSION }}
        </p>
        <p class="text-sm text-content-muted">
          {{ $t('plugins.common.outdated.current') }}: {{ store.currentTnsPluginVersion || '-' }}
        </p>
      </div>

      <div v-else class="tns-card p-0 overflow-hidden">
        <FilebrowserTopControls
          :show-images-only="showImagesOnly"
          :new-folder-name="newFolderName"
          :search-query="searchQuery"
          :sort-key="sortKey"
          :current-path="currentPath"
          :can-go-up="canGoUp"
          :is-loading="isLoading"
          :sort-dir="sortDir"
          :directories-count="visibleDirectories.length"
          :files-count="visibleFiles.length"
          :breadcrumbs="breadcrumbs"
          @update:show-images-only="showImagesOnly = $event"
          @update:new-folder-name="newFolderName = $event"
          @update:search-query="searchQuery = $event"
          @update:sort-key="sortKey = $event"
          @jump-to-image-path="jumpToImageSavePath"
          @go-up="goUp"
          @refresh="refreshCurrent"
          @create-directory="createDirectory"
          @browse="browse"
          @select-all="selectAllVisible"
          @toggle-sort-dir="toggleSortDir"
        />

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-h-[460px]">
          <FilebrowserListPanel
            :is-loading="isLoading"
            :error-message="errorMessage"
            :is-filtered="isFiltered"
            :directories="visibleDirectories"
            :files="visibleFiles"
            :is-selected="isSelected"
            :format-size="formatSize"
            :format-date-time="formatDateTime"
            :get-file-extension="getFileExtension"
            @open-directory="openDirectory"
            @toggle-selection="toggle"
          />

          <FilebrowserDetailsPanel
            :selected-entry="singleSelection"
            :selected-entry-type="singleSelection?.entryType || null"
            :selected-entry-type-label="selectedEntryTypeLabel"
            :is-selected-entry-image="isSelectedEntryImage"
            :selection-count="selectionCount"
            :is-downloading="isDownloading"
            :format-size="formatSize"
            :format-date-time="formatDateTime"
            @open-file="openFile"
            @rename-entry="openRenameDialog"
            @download-entry="downloadOne"
          />
        </div>
      </div>

      <!-- Room for the sticky action bar so it never covers the last row. -->
      <div v-if="selectionCount" class="h-24" />
    </div>

    <FilebrowserSelectionBar
      :selection-count="selectionCount"
      :can-open="!!singleSelection && singleSelection.entryType === 'file'"
      :can-rename="!!singleSelection"
      :can-download="selectedFiles.length > 0"
      :download-progress="downloadProgress"
      @open="openSelected"
      @download="downloadSelected"
      @rename="renameSelected"
      @delete="deleteSelected"
      @clear="clearSelection"
      @cancel="cancelDownload"
    />

    <FilebrowserPreviewModal
      :visible="previewVisible"
      :loading="previewLoading"
      :image-loading="previewImageLoading"
      :error="previewError"
      :url="previewUrl"
      :file-name="previewFileName"
      :is-downloading="isDownloading"
      :info="previewInfo"
      :header-entries="previewHeaderEntries"
      :stretch-factor="previewStretchFactor"
      :black-clipping="previewBlackClipping"
      :unlinked="previewUnlinked"
      :debayer="previewDebayer"
      @close="closePreview"
      @download="downloadPreviewEntry"
      @image-load="handleImageLoad"
      @image-error="handlePreviewError"
      @update:stretch-factor="previewStretchFactor = $event"
      @update:black-clipping="previewBlackClipping = $event"
      @update:unlinked="previewUnlinked = $event"
      @update:debayer="previewDebayer = $event"
    />

    <FilebrowserRenameDialog
      :visible="renameDialogVisible"
      :title="renameDialogTitle"
      :error="renameDialogError"
      :input-value="renameInputValue"
      @update:input-value="renameInputValue = $event"
      @close="closeRenameDialog"
      @confirm="confirmRenameDialog"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import FilebrowserTopControls from '@/plugins/filebrowser/components/FilebrowserTopControls.vue';
import FilebrowserListPanel from '@/plugins/filebrowser/components/FilebrowserListPanel.vue';
import FilebrowserDetailsPanel from '@/plugins/filebrowser/components/FilebrowserDetailsPanel.vue';
import FilebrowserSelectionBar from '@/plugins/filebrowser/components/FilebrowserSelectionBar.vue';
import FilebrowserPreviewModal from '@/plugins/filebrowser/components/FilebrowserPreviewModal.vue';
import FilebrowserRenameDialog from '@/plugins/filebrowser/components/FilebrowserRenameDialog.vue';
import { useImagePreview } from '@/plugins/filebrowser/composables/useImagePreview';
import {
  getFileExtension,
  isImageFile,
  useFilebrowserList,
} from '@/plugins/filebrowser/composables/useFilebrowserList';
import { useFilebrowserSelection } from '@/plugins/filebrowser/composables/useFilebrowserSelection';
import { useFilebrowserDownload } from '@/plugins/filebrowser/composables/useFilebrowserDownload';

// The filesystem controller's imageinfo/preview/download/rename endpoints ship with plugin
// 1.4.0.0. PINS serves them from its own daemon, so only NINA mode needs the gate.
const MIN_TNS_PLUGIN_VERSION = '1.4.0.0';

const { t } = useI18n();
const store = apiStore();

const isPluginVersionSupported = computed(
  () =>
    store.isPINS ||
    store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, MIN_TNS_PLUGIN_VERSION)
);
const toastStore = useToastStore();

const currentPath = ref('');
const parentPath = ref('');
const directories = ref([]);
const files = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const newFolderName = ref('');

const renameDialogVisible = ref(false);
const renameDialogError = ref('');
const renameInputValue = ref('');
const renameTarget = ref(null);

const {
  searchQuery,
  sortKey,
  sortDir,
  showImagesOnly,
  visibleDirectories,
  visibleFiles,
  isFiltered,
  toggleSortDir,
  clearSearch,
} = useFilebrowserList(directories, files);

const {
  selectedList,
  selectedFiles,
  selectionCount,
  singleSelection,
  isSelected,
  toggle,
  selectOnly,
  selectAll,
  clear: clearSelection,
} = useFilebrowserSelection();

const {
  progress: downloadProgress,
  isDownloading,
  downloadOne,
  downloadMany,
  cancel: cancelDownload,
} = useFilebrowserDownload();

const {
  previewVisible,
  previewUrl,
  previewEntry,
  previewFileName,
  previewLoading,
  previewImageLoading,
  previewError,
  previewInfo,
  previewHeaderEntries,
  previewStretchFactor,
  previewBlackClipping,
  previewUnlinked,
  previewDebayer,
  closePreview,
  openFile,
  handlePreviewError,
  handleImageLoad,
} = useImagePreview({ apiService, downloadFile: (file) => downloadOne(file) });

const selectedEntryTypeLabel = computed(() => {
  if (singleSelection.value?.entryType === 'directory') {
    return t('plugins.filebrowser.directory');
  }

  if (singleSelection.value?.entryType === 'file') {
    return t('plugins.filebrowser.file');
  }

  return '—';
});

const isSelectedEntryImage = computed(
  () => singleSelection.value?.entryType === 'file' && isImageFile(singleSelection.value.name)
);

const renameDialogTitle = computed(() => {
  if (!renameTarget.value) {
    return t('common.edit');
  }

  const typeLabel =
    renameTarget.value.entryType === 'file'
      ? t('plugins.filebrowser.file')
      : t('plugins.filebrowser.directory');

  return `${t('common.edit')} ${typeLabel}`;
});

const canGoUp = computed(() => {
  return !!parentPath.value && parentPath.value !== currentPath.value;
});

const breadcrumbs = computed(() => {
  const path = currentPath.value;
  if (!path) {
    return [];
  }

  const isWindows = path.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const parts = path.split(separator).filter(Boolean);

  return parts.map((label, idx) => {
    let builtPath = parts.slice(0, idx + 1).join(separator);

    if (idx === 0 && isWindows) {
      builtPath += separator;
    }

    if (!isWindows) {
      builtPath = '/' + builtPath;
    }

    return {
      label,
      path: builtPath,
    };
  });
});

function formatSize(bytes) {
  if (bytes == null) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(isoDate) {
  if (!isoDate) {
    return '—';
  }

  const date = new Date(isoDate);
  return date.toLocaleString();
}

function openRenameDialog(entry, entryType) {
  if (!entry?.path || !entry?.name) {
    return;
  }

  renameTarget.value = {
    path: entry.path,
    name: entry.name,
    entryType,
  };

  renameDialogError.value = '';
  renameInputValue.value = entry.name;
  renameDialogVisible.value = true;
}

function closeRenameDialog() {
  renameDialogVisible.value = false;
  renameDialogError.value = '';
  renameInputValue.value = '';
  renameTarget.value = null;
}

async function browse(path = '') {
  errorMessage.value = '';
  isLoading.value = true;
  closePreview();
  clearSelection();

  try {
    const response = await apiService.browseFilesystem(path || '');
    if (!response?.success) {
      throw new Error(response?.error || t('plugins.filebrowser.loadError'));
    }

    currentPath.value = response.currentPath || path || '';
    parentPath.value = response.parentPath || '';
    directories.value = Array.isArray(response.directories) ? response.directories : [];
    files.value = Array.isArray(response.files) ? response.files : [];
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.loadError');
    directories.value = [];
    files.value = [];
  } finally {
    isLoading.value = false;
  }
}

function refreshCurrent() {
  browse(currentPath.value);
}

function goUp() {
  if (!canGoUp.value) {
    return;
  }

  browse(parentPath.value);
}

function openDirectory(directory) {
  clearSearch();
  browse(directory.path);
}

function selectAllVisible() {
  selectAll(visibleDirectories.value, visibleFiles.value);
}

function openSelected() {
  const entry = singleSelection.value;
  if (entry?.entryType === 'file') {
    openFile(entry);
  }
}

function downloadSelected() {
  downloadMany(selectedFiles.value);
}

function downloadPreviewEntry() {
  if (previewEntry.value) {
    downloadOne(previewEntry.value);
  }
}

function renameSelected() {
  const entry = singleSelection.value;
  if (entry) {
    openRenameDialog(entry, entry.entryType);
  }
}

function buildSiblingPath(sourcePath, newName) {
  const source = String(sourcePath || '');
  const isWindows = source.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const normalized = source.replace(/[/\\]+$/, '');
  const lastSeparator = normalized.lastIndexOf(separator);

  if (lastSeparator < 0) {
    return newName;
  }

  if (!isWindows && lastSeparator === 0) {
    return `${separator}${newName}`;
  }

  return `${normalized.slice(0, lastSeparator)}${separator}${newName}`;
}

async function confirmRenameDialog() {
  const target = renameTarget.value;
  if (!target?.path || !target?.name) {
    return;
  }

  const nextName = renameInputValue.value.trim();
  if (!nextName) {
    renameDialogError.value = t('plugins.filebrowser.renameEmptyName');
    return;
  }

  if (nextName === target.name) {
    closeRenameDialog();
    return;
  }

  const targetPath = buildSiblingPath(target.path, nextName);
  const entryType = target.entryType;

  try {
    await apiService.renameFilesystemEntry(target.path, targetPath);
    closeRenameDialog();
    await browse(currentPath.value);

    // Keep the renamed entry selected so the action bar stays where the user left it.
    const source = entryType === 'file' ? files.value : directories.value;
    const renamed = source.find((entry) => entry.path === targetPath);
    if (renamed) {
      selectOnly(renamed, entryType);
    }
  } catch (error) {
    renameDialogError.value = error?.message || t('plugins.filebrowser.renameError');
  }
}

async function createDirectory() {
  const folderName = newFolderName.value.trim();
  if (!folderName || !currentPath.value) {
    return;
  }

  const isWindows = currentPath.value.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const newDirectoryPath = currentPath.value.replace(/[/\\]+$/, '') + separator + folderName;

  try {
    await apiService.createFilesystemDirectory(newDirectoryPath);
    newFolderName.value = '';
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.createError');
  }
}

async function deleteSelected() {
  const entries = selectedList.value;
  if (!entries.length) {
    return;
  }

  const directoryCount = entries.filter((entry) => entry.entryType === 'directory').length;
  const message =
    entries.length === 1
      ? entries[0].entryType === 'directory'
        ? t('plugins.filebrowser.deleteDirectoryMessage', { name: entries[0].name })
        : t('plugins.filebrowser.deleteFileMessage', { name: entries[0].name })
      : t('plugins.filebrowser.deleteSelectedMessage', {
          count: entries.length,
          directories: directoryCount,
        });

  const confirmed = await toastStore.showConfirmation(
    t('plugins.filebrowser.deleteSelectedTitle'),
    message,
    t('common.delete'),
    t('common.cancel')
  );

  if (!confirmed) {
    return;
  }

  let failed = 0;
  let lastError = '';

  for (const entry of entries) {
    try {
      if (entry.entryType === 'directory') {
        await apiService.deleteFilesystemDirectory(entry.path);
      } else {
        await apiService.deleteFilesystemFile(entry.path);
      }
    } catch (error) {
      failed += 1;
      lastError = error?.message || '';
      console.error('[Filebrowser] Delete failed:', entry.path, error);
    }
  }

  await browse(currentPath.value);

  if (failed) {
    errorMessage.value = lastError || t('plugins.filebrowser.deleteError');
  }
}

async function jumpToImageSavePath() {
  const path = store.imageSavePath || '';
  if (!path) {
    await browse('');
    return;
  }

  await browse(path);
  if (errorMessage.value) {
    await browse('');
  }
}

onMounted(() => {
  if (!isPluginVersionSupported.value) {
    return;
  }

  jumpToImageSavePath();
});
</script>
