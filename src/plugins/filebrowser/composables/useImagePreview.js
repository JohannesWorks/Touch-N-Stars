import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import { isPreviewableFile } from './useFilebrowserList';

// Matches NINA's own IImageSettings defaults (NINA.Profile/ImageSettings.cs), so a
// freshly opened preview looks like the frame does in NINA before the user touches a slider.
const DEFAULT_STRETCH_FACTOR = 0.2;
const DEFAULT_BLACK_CLIPPING = -2.8;
const DEBOUNCE_MS = 250;

function isAbortError(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
}

function computeMaxWidth() {
  const dpr = window.devicePixelRatio || 1;
  return Math.min(2048, Math.round(window.innerWidth * dpr));
}

/**
 * Server-rendered image/FITS/XISF/raw preview (Phase 2). Replaces the old client-side
 * FITS decoder: the backend does the decode/debayer/stretch, this composable just
 * requests a URL and binds it to <img>.
 */
export function useImagePreview({ apiService, downloadFile }) {
  const { t } = useI18n();
  const toastStore = useToastStore();

  const previewVisible = ref(false);
  const previewUrl = ref('');
  const previewEntry = ref(null);
  const previewFileName = ref('');
  const previewLoading = ref(false);
  const previewImageLoading = ref(false);
  const previewError = ref('');
  const previewInfo = ref(null);
  const previewHeaderEntries = ref([]);

  const previewStretchFactor = ref(DEFAULT_STRETCH_FACTOR);
  const previewBlackClipping = ref(DEFAULT_BLACK_CLIPPING);
  const previewUnlinked = ref(false);
  const previewDebayer = ref(true);

  const abortController = ref(null);
  let debounceTimer = null;

  function buildPreviewUrl(file) {
    return apiService.getFilesystemPreviewUrl(file.path, {
      maxWidth: computeMaxWidth(),
      stretch: previewStretchFactor.value,
      blackClipping: previewBlackClipping.value,
      unlinked: previewUnlinked.value,
      debayer: previewDebayer.value,
    });
  }

  // Assigning the same src to <img> is a no-op for the browser: no request, no load event.
  // Raising the spinner for it would leave the modal waiting forever, so bail out instead.
  function applyPreviewUrl(file) {
    const url = buildPreviewUrl(file);
    if (url === previewUrl.value) {
      return;
    }

    previewImageLoading.value = true;
    previewUrl.value = url;
  }

  function closePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    abortController.value?.abort();
    abortController.value = null;

    previewVisible.value = false;
    previewUrl.value = '';
    previewEntry.value = null;
    previewFileName.value = '';
    previewLoading.value = false;
    previewImageLoading.value = false;
    previewError.value = '';
    previewInfo.value = null;
    previewHeaderEntries.value = [];
    previewStretchFactor.value = DEFAULT_STRETCH_FACTOR;
    previewBlackClipping.value = DEFAULT_BLACK_CLIPPING;
    previewUnlinked.value = false;
    previewDebayer.value = true;
  }

  async function openFile(file) {
    if (!file?.path) {
      return;
    }

    if (!isPreviewableFile(file.name)) {
      // Not worth a round trip for e.g. .txt/.log - go straight to download.
      downloadFile?.(file);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = null;
    abortController.value?.abort();
    const controller = new AbortController();
    abortController.value = controller;

    previewEntry.value = file;
    previewFileName.value = file.name || file.path;
    previewVisible.value = true;
    previewLoading.value = true;
    previewError.value = '';
    previewUrl.value = '';
    previewInfo.value = null;
    previewHeaderEntries.value = [];
    previewStretchFactor.value = DEFAULT_STRETCH_FACTOR;
    previewBlackClipping.value = DEFAULT_BLACK_CLIPPING;
    previewUnlinked.value = false;
    previewDebayer.value = true;

    try {
      const info = await apiService.fetchFilesystemImageInfo(file.path, {
        signal: controller.signal,
      });

      // A newer openFile() already took over the modal - its state must not be overwritten
      // by this response, even if it arrived before the abort landed.
      if (abortController.value !== controller) {
        return;
      }

      if (!info?.success || !info?.isSupported) {
        closePreview();
        toastStore.showToast({
          type: 'info',
          message: t('plugins.filebrowser.fits.unsupportedFile'),
        });
        downloadFile?.(file);
        return;
      }

      previewInfo.value = info;
      previewHeaderEntries.value = Array.isArray(info.headers) ? info.headers : [];
      previewDebayer.value = !!info.isBayered;
      applyPreviewUrl(file);
    } catch (error) {
      if (isAbortError(error) || abortController.value !== controller) {
        return;
      }
      previewError.value = error?.message || 'Failed to load preview';
    } finally {
      if (abortController.value === controller) {
        previewLoading.value = false;
      }
    }
  }

  function scheduleStretchUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (previewEntry.value) {
        // preview is consumed as <img src>, so this only rate-limits how often the src
        // changes - the browser's own request lifecycle handles cancelling the previous
        // in-flight image load, and the backend's render cache absorbs any overlap.
        applyPreviewUrl(previewEntry.value);
      }
    }, DEBOUNCE_MS);
  }

  watch([previewStretchFactor, previewBlackClipping, previewUnlinked, previewDebayer], () => {
    if (!previewVisible.value || previewLoading.value || previewError.value) {
      return;
    }
    scheduleStretchUpdate();
  });

  // A failed render is not the same as an unsupported file: keep the modal open and say so,
  // instead of silently starting a multi-megabyte download the user never asked for. The
  // modal's own download button is still there if they want the file anyway.
  function handlePreviewError() {
    previewImageLoading.value = false;
    previewError.value = t('plugins.filebrowser.fits.previewFailed');
  }

  function handleImageLoad() {
    previewImageLoading.value = false;
  }

  return {
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
  };
}
