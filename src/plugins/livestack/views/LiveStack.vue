<template>
  <div class="livestack-page">
    <div v-if="pageIsLoading" class="flex flex-col items-center justify-center h-64">
      <svg
        class="animate-spin -ml-1 mr-3 h-10 w-10 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <!-- Error Message when plugin not available or version incompatible -->
    <div
      v-else-if="!pageIsLoading && (!livestackPluginAvailable || errorMessage)"
      class="border border-red-700 rounded-lg bg-red-900/50 shadow-lg p-4 m-4"
    >
      <p class="text-red-400 text-center">
        {{ errorMessage || t('plugins.livestack.not_available') }}
      </p>
    </div>
    <div v-else-if="pageIsLoading" class="flex flex-col items-center justify-center h-64">
      <svg
        class="animate-spin -ml-1 mr-3 h-10 w-10 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-gray-500 mt-2">{{ t('loading') }}</p>
    </div>
    <!-- Main content when plugin is available -->
    <div v-else>
      <!-- Fullscreen Image Display -->
      <div class="fixed inset-0 z-10">
        <!-- ZoomableImage Component - Full Screen -->
        <ZoomableImage
          :imageData="stretchedImageUrl"
          :loading="isLoading || stretchRendering"
          :showDownload="true"
          :showFullscreen="false"
          :showHistogram="true"
          controlsClass="right-2 bottom-above-statusbar left-2 landscape:left-(--nav-offset)"
          :initialZoom="currentZoomLevel"
          height="100vh"
          :altText="imageAltText"
          :placeholderText="imagePlaceholderText"
          @image-load="handleImageLoad"
          @image-error="handleImageError"
          @download="handleDownload"
          @histogram-toggle="toggleHistogram"
          class="bg-gray-900"
        >
          <!-- Custom placeholder -->
          <template #placeholder>
            <div class="flex flex-col items-center justify-center text-gray-400">
              <img
                src="../../../assets/Logo_TouchNStars_600x600.png"
                alt="TouchNStars Logo"
                class="w-44 h-44 opacity-50 mb-4"
              />
              <p class="text-lg">{{ t('plugins.livestack.no_image_available') }}</p>
              <p class="text-sm mt-2">{{ t('plugins.livestack.start_and_select_filter') }}</p>
            </div>
          </template>
        </ZoomableImage>

        <!-- Histogram Overlay -->
        <div
          v-if="showHistogram && livestackStore.currentImageUrl"
          class="absolute top-60 left-4 landscape:left-(--nav-offset) landscape:top-24 right-4 z-70"
        >
          <HistogramChart :imageUrl="livestackStore.currentImageUrl" height="100px">
            <template #status-action="{ status }">
              <template v-if="status === 'livestack-save-disabled'">
                <span v-if="livestackStore.saveStackedLights === null">
                  {{ t('plugins.livestack.histogram_enable_in_plugin') }}
                </span>
                <span v-else-if="livestackStore.saveStackedLights">
                  {{ t('plugins.livestack.histogram_next_frame') }}
                </span>
                <button
                  v-else
                  type="button"
                  class="tns-btn-primary w-auto! px-3! text-xs!"
                  :disabled="livestackStore.saveStackedLightsBusy"
                  @click="livestackStore.setSaveStackedLights(true)"
                >
                  {{ t('plugins.livestack.save_stacked_lights_enable') }}
                </button>
              </template>
            </template>
          </HistogramChart>
        </div>
      </div>

      <!-- Control Panel Overlay -->
      <LivestackControlBar @error="errorMessage = $event" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import apiService from '@/services/apiService';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import HistogramChart from '@/components/helpers/HistogramChart.vue';
import websocketChannelService from '@/services/websocketChannelSocket.js';
import { useLivestackStore } from '../store/livestackStore.js';
import { useRawStretch } from '@/composables/useRawStretch';
import { useI18n } from 'vue-i18n';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import LivestackControlBar from '../components/LivestackControlBar.vue';
import { storeToRefs } from 'pinia';
import { timeSync } from '@/utils/timeSync';

const { t } = useI18n();
const livestackStore = useLivestackStore();
const store = apiStore();
const settingsStore = useSettingsStore();
const isLoading = ref(false);
const lastUpdated = ref(null);
const errorMessage = ref(null);
const wsStatus = ref('disconnected');
const currentZoomLevel = ref(1);
const livestackPluginAvailable = ref(false);
const pageIsLoading = ref(true);
const showHistogram = ref(false);
// Every stack update replaces currentImageUrl; the old entry is released with it.
const { displayUrl: stretchedImageUrl, rendering: stretchRendering } = useRawStretch(
  () => livestackStore.currentImageUrl,
  () =>
    livestackStore.currentImageTarget && livestackStore.currentImageFilter
      ? {
          kind: 'livestack',
          target: livestackStore.currentImageTarget,
          filter: livestackStore.currentImageFilter,
        }
      : null,
  showHistogram,
  { releaseOnChange: true, releaseOnUnmount: true }
);
const livestackRefs = storeToRefs(livestackStore);

// The option may have been changed in NINA or by another client since the page opened.
const toggleHistogram = () => {
  showHistogram.value = !showHistogram.value;
  if (showHistogram.value) livestackStore.loadLivestackSettings();
};
const imageAltText = computed(() =>
  t('plugins.livestack.image_alt', { filter: livestackStore.selectedFilter?.label ?? '' })
);
const imagePlaceholderText = computed(() => t('plugins.livestack.loading_image'));

// Observe changes to target/filter together to avoid duplicate loads
watch(
  () => [livestackRefs.selectedTarget.value, livestackRefs.selectedFilter.value],
  ([newTarget, newFilter], [oldTarget, oldFilter]) => {
    const targetLabel = newTarget?.label;
    const filterLabel = newFilter?.label;

    const oldTargetLabel = oldTarget?.label ?? oldTarget;
    const oldFilterLabel = oldFilter?.label ?? oldFilter;

    // Skip if nothing changed or labels are missing
    if (!targetLabel || !filterLabel) return;
    if (targetLabel === oldTargetLabel && filterLabel === oldFilterLabel) return;

    loadImage(targetLabel, filterLabel);
  }
);

const loadImage = async (target, filter, forceReload = false) => {
  const targetLabel = target?.label ?? target;
  const filterLabel = filter?.label ?? filter;

  // Check if we should reload the image (unless forced)
  if (!forceReload && !livestackStore.shouldReloadImage(targetLabel, filterLabel)) {
    console.log('Using cached image for', targetLabel, filterLabel);
    return;
  }

  console.log('Loading new image...');
  isLoading.value = true;
  errorMessage.value = null;

  const cameraWidth = store.profileInfo?.FramingAssistantSettings?.CameraWidth;
  const cameraHeight = store.profileInfo?.FramingAssistantSettings?.CameraHeight;
  const maxDimension = Math.max(cameraWidth, cameraHeight);
  const scale = maxDimension > 2000 ? 2000 / maxDimension : 100;
  console.log(`Calculated scale: ${scale}% for camera size ${cameraWidth}x${cameraHeight}`);
  try {
    const newImageUrl = await apiService.getLivestackImage(
      targetLabel,
      filterLabel,
      settingsStore.camera.imageQuality,
      scale
    );

    // Only update the image URL after successful load
    livestackStore.setCurrentImageUrl(newImageUrl, targetLabel, filterLabel);
    lastUpdated.value = new Date(timeSync.getServerTime()).toLocaleTimeString();
  } catch (error) {
    console.error('Error loading image:', error);
    errorMessage.value = t('plugins.livestack.errors.loading_image', { message: error.message });
  } finally {
    isLoading.value = false;
  }
};

const forceLoadImage = async (target, filter) => {
  console.log(`forceLoadImage called: target=${target}, filter=${filter}`);
  // Force reload even if cached - used for websocket updates
  await loadImage(target, filter, true);
};

const handleImageLoad = () => {
  console.log('Livestack image loaded successfully');
};

const handleImageError = (event) => {
  console.error('Error loading livestack image:', event);
  errorMessage.value = t('plugins.livestack.errors.failed_to_load');
};

const handleDownload = async (data) => {
  await downloadImageHelper(data.imageData, new Date().toISOString().split('T')[0], {
    folderPrefix: 'TNS-Images',
    filePrefix: 'TNS',
  });
};

// WebSocket handlers
const handleWebSocketStatus = (status) => {
  wsStatus.value = status;
  console.log('Livestack WebSocket status:', status);
};

const handleWebSocketMessage = async (message) => {
  // Handle STACK-UPDATED events
  if (message.Type === 'Socket' && message.Success && message.Response) {
    const { Event } = message.Response;

    if (Event === 'STACK-UPDATED') {
      const { Target, Filter } = message.Response;

      // Use authoritative API to get the count for this specific pair
      await livestackStore.fetchAndUpdateCount(Target, Filter);

      // Resolve current target/ filter labels (store may hold objects or strings)
      const selectedTargetLabel = livestackStore.selectedTarget?.label;
      const selectedFilterLabel = livestackStore.selectedFilter?.label;

      // If this is the currently selected target and filter, force reload the image
      if (
        (selectedTargetLabel === Target && selectedFilterLabel === Filter) ||
        (!livestackStore.currentImageUrl && selectedFilterLabel === Filter)
      ) {
        console.log('Force reloading current image due to stack update');
        await forceLoadImage(Target, Filter);
      }
    } else if (Event === 'STACK-STATUS') {
      const { Status } = message.Response;
      livestackStore.status = Status ? Status.toLowerCase() : Status;
      console.log('Current status:', livestackStore.status);
    } else if (Event === 'STACK-RESET') {
      livestackStore.resetStack();
    } else if (Event === 'STACK-RGB-CREATED' || Event === 'STACK-RGB-REMOVED') {
      // The set of available stacks changed - another client may have triggered this
      await livestackStore.checkImageAvailability();
      if (store.isPINS) {
        await livestackStore.loadRgbCandidates();
      }
    }
  }
};

onMounted(async () => {
  if (store.isBackendReachable === false) {
    console.warn('Backend is not reachable - skipping livestack initialization');
    pageIsLoading.value = false;
    return;
  }

  // Check API version - LiveStack requires 2.2.12.0 or higher
  const minimumApiVersion = '2.2.12.0';
  const isVersionValid = store.checkVersionNewerOrEqual(store.currentApiVersion, minimumApiVersion);

  if (!isVersionValid) {
    console.error(
      `LiveStack requires API version ${minimumApiVersion} or higher. Current version: ${store.currentApiVersion}`
    );
    errorMessage.value = t('plugins.livestack.errors.api_version_required', {
      version: minimumApiVersion,
    });
    pageIsLoading.value = false;
    return;
  }

  const response = await apiService.getPlugins();
  console.log('Plugins response:', response);

  // Check if Livestack plugin is available
  if (
    !response.Success ||
    !response.Response?.some((plugin) => plugin.toLowerCase() === 'livestack')
  ) {
    console.error('Livestack plugin is not available or not installed');
    pageIsLoading.value = false;
    return;
  }

  livestackPluginAvailable.value = true;

  // Setup WebSocket callbacks on the global WebSocket service
  const originalStatusCallback = websocketChannelService.statusCallback;
  const originalMessageCallback = websocketChannelService.messageCallback;

  websocketChannelService.setStatusCallback((status) => {
    handleWebSocketStatus(status);
    if (originalStatusCallback) originalStatusCallback(status);
  });

  websocketChannelService.setMessageCallback((message) => {
    handleWebSocketMessage(message);
    if (originalMessageCallback) originalMessageCallback(message);
  });

  // Ensure WebSocket is connected
  try {
    if (!websocketChannelService.isWebSocketConnected()) {
      console.log('WebSocket not connected, attempting to connect...');
      await websocketChannelService.connect();
    }
    // Subscribe to livestack events
    websocketChannelService.subscribe('STACK-UPDATED');
    websocketChannelService.subscribe('STACK-STATUS');
    websocketChannelService.subscribe('STACK-RESET');
    websocketChannelService.subscribe('STACK-RGB-CREATED');
    websocketChannelService.subscribe('STACK-RGB-REMOVED');
  } catch (error) {
    console.error('Failed to connect WebSocket for livestack:', error);
  }

  // Initial Livestack state
  const initialStatus = await apiService.livestackStatus();
  livestackStore.status = initialStatus.Response ? initialStatus.Response.toLowerCase() : 'stopped';

  // Initial check for available images
  await livestackStore.checkImageAvailability();

  // Load current image in background if target and filter are available
  if (livestackStore.selectedTarget && livestackStore.selectedFilter) {
    console.log(
      'Loading cached image on mount:',
      livestackStore.selectedTarget,
      livestackStore.selectedFilter
    );
    const t = livestackStore.selectedTarget?.label;
    const f = livestackStore.selectedFilter?.label;
    forceLoadImage(t, f);
  }
  pageIsLoading.value = false;
});
</script>

<style scoped>
/* iOS Safari scroll fix - make scrolling work on fixed positioned elements */
.livestack-page {
  -webkit-user-select: none;
  user-select: none;
}

:deep(.scrollbar-thin) {
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
}

:deep(.scrollbar-thin::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scrollbar-thin::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.scrollbar-thin::-webkit-scrollbar-thumb) {
  background-color: #4a5568;
  border-radius: 20px;
}
</style>
