import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { useToastStore } from '@/store/toastStore';
import { useHaptics } from '@/composables/useHaptics';
import { downloadBlob } from '@/utils/blobDownloader';

const DOWNLOAD_FOLDER = 'TouchNStars/Filebrowser';

/**
 * Saves files from the NINA/PINS machine onto the device.
 *
 * Transfers run strictly one after another: a phone cannot hold several 50 MB
 * FITS buffers in memory at once. downloadBlob handles the platform split
 * (Capacitor Filesystem on Android/iOS, file-saver in the browser).
 */
export function useFilebrowserDownload() {
  const { t } = useI18n();
  const toastStore = useToastStore();
  const { notifySuccess, notifyError } = useHaptics();

  const progress = reactive({
    active: false,
    currentIndex: 0,
    total: 0,
    currentName: '',
    percent: 0,
  });

  const abortController = ref(null);
  const isDownloading = computed(() => progress.active);

  function resetProgress() {
    progress.active = false;
    progress.currentIndex = 0;
    progress.total = 0;
    progress.currentName = '';
    progress.percent = 0;
    abortController.value = null;
  }

  function cancel() {
    abortController.value?.abort();
  }

  function isAbortError(error) {
    return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
  }

  async function downloadEntry(entry, controller) {
    const { blob } = await apiService.fetchFilesystemFileBlob(entry.path, {
      signal: controller.signal,
      onDownloadProgress: (event) => {
        // Needs Content-Length from the backend; without it total stays undefined
        // and the bar simply keeps its last value.
        if (event?.total) {
          progress.percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
        }
      },
    });

    await downloadBlob(blob, entry.name, {
      folderName: DOWNLOAD_FOLDER,
      fallbackFilename: 'download.bin',
    });
  }

  /**
   * @param {Array<{ name: string, path: string }>} entries
   * @returns {Promise<{ succeeded: number, failed: number, canceled: boolean }>}
   */
  async function downloadMany(entries) {
    const targets = (entries || []).filter((entry) => entry?.path);
    if (!targets.length || progress.active) {
      return { succeeded: 0, failed: 0, canceled: false };
    }

    const controller = new AbortController();
    abortController.value = controller;

    progress.active = true;
    progress.total = targets.length;
    progress.currentIndex = 0;
    progress.percent = 0;

    let succeeded = 0;
    let failed = 0;
    let canceled = false;
    let lastError = '';

    for (const entry of targets) {
      if (controller.signal.aborted) {
        canceled = true;
        break;
      }

      progress.currentIndex += 1;
      progress.currentName = entry.name || entry.path;
      progress.percent = 0;

      try {
        await downloadEntry(entry, controller);
        succeeded += 1;
      } catch (error) {
        if (isAbortError(error)) {
          canceled = true;
          break;
        }
        failed += 1;
        lastError = error?.message || '';
        console.error('[Filebrowser] Download failed:', entry.path, error);
      }
    }

    resetProgress();

    if (failed) {
      notifyError();
      toastStore.showToast({
        type: 'error',
        title: t('plugins.filebrowser.download.failedTitle'),
        message: t('plugins.filebrowser.download.failedMessage', {
          failed,
          succeeded,
          error: lastError,
        }),
      });
    } else if (succeeded) {
      notifySuccess();
      toastStore.showToast({
        type: 'success',
        title: t('plugins.filebrowser.download.doneTitle'),
        message: t('plugins.filebrowser.download.doneMessage', { count: succeeded }),
      });
    }

    return { succeeded, failed, canceled };
  }

  function downloadOne(entry) {
    return downloadMany([entry]);
  }

  return {
    progress,
    isDownloading,
    downloadOne,
    downloadMany,
    cancel,
  };
}
