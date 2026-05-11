import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import i18n from '@/i18n';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useFlatassistantStore = defineStore('flatassistantStore', {
  state: () => ({
    count: 20,
    darkCount: 0,
    ExposureTime: 2,
    minExposureTime: 0.01,
    maxExposureTime: 20,
    brightness: 100,
    minBrightness: 0,
    maxBrightness: 32000,
    histogramMean: 50,
    meanTolerance: 10,
    binning: '1x1',
    gain: 100,
    offset: 0,
    status: {
      State: '',
      TotalIterations: 0,
      CompletedIterations: -1,
      TotalFilters: 0,
      CompletedFilters: -1,
    },
    // Summary of the most recently completed run; null when no run has finished yet.
    // { type: 'flats'|'darks', completed: number, total: number, success: boolean, lastADU: number|null }
    lastRun: null,
    // ADU (Mean) of the most recently captured image during the current run
    currentADU: null,
    // Last human-readable status message received from NINA/PINS via SignalR progress hub.
    signalRStatus: null,
    // Locked outcome set once when a run completes — stays until the next run starts.
    // { type: 'success'|'warning'|'error'|'info', message: string }
    lastRunOutcome: null,
    currentRunType: 'flats',
    workflowStopRequested: false,
    intervalId: null,
    // Per-filter run results for multi-mode; survives tab switches as store state.
    // { [filterId]: null | 'success' | 'failed' | 'dim' | 'bright' | 'stopped' }
    filterResults: {},
    // Name of the filter currently being processed in multi-mode, null otherwise.
    currentFilterName: null,
  }),
  actions: {
    async fetchFlatsInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable flats');
          return;
        }

        const prevState = this.status.State;
        const prevCompleted = this.status.CompletedIterations;
        const prevTotal = this.status.TotalIterations;

        // Check both TNS (multimode) and ninaAPI status in parallel.
        // TNS takes precedence when its task is running.
        const [tnsResult, ninaResult] = await Promise.allSettled([
          apiService.flatMultiStatus(),
          apiService.flatassistantAction('status'),
        ]);

        const tnsNext = tnsResult.status === 'fulfilled' ? tnsResult.value?.Response : null;
        const ninaNext = ninaResult.status === 'fulfilled' ? ninaResult.value?.Response : null;

        // During an active multi-mode run prefer tnsNext always — even during brief
        // inter-filter Finished transitions — to avoid flickering from ninaNext's stale ADU.
        const isActiveMultiRun = this.currentRunType === 'flats-multi' && this.lastRun === null;
        const next =
          tnsNext?.State === 'Running' || isActiveMultiRun
            ? (tnsNext ?? ninaNext ?? this.status)
            : (ninaNext ?? tnsNext ?? this.status);

        // A new run is starting — clear the previous result
        if (prevState !== 'Running' && next.State === 'Running') {
          this.lastRun = null;
          this.currentADU = null;
          this.lastRunOutcome = null;
        }

        // ADU: only update while a run is active (lastRun === null).
        // Once waitForCompletion sets lastRun, freeze currentADU at that value.
        if (this.lastRun === null && next.CurrentADU !== null && next.CurrentADU !== undefined) {
          this.currentADU = Math.round(next.CurrentADU);
        }

        this.status = next;
      } catch (error) {
        console.error('Error fetching information:', error);
      }
    },

    startManagedRun(type = 'flats') {
      this.currentRunType = type;
      this.workflowStopRequested = false;
      this.lastRun = null;
      this.currentADU = null;
      this.signalRStatus = null;
      this.lastRunOutcome = null;
    },

    updateSignalRStatus(message) {
      if (message && message.trim()) {
        this.signalRStatus = message.trim();
      }
    },

    didRunSucceed(status) {
      if (status?.State !== 'Finished') return false;
      const total = Number(status?.TotalIterations);
      const completed = Number(status?.CompletedIterations);
      // PINS / SkyFlat report -1 — outcome unknown from REST alone, don't claim success
      if (total < 0) return false;
      return total > 0 && completed >= total;
    },

    shouldOfferDarks(status) {
      return this.darkCount > 0 && this.didRunSucceed(status) && !this.workflowStopRequested;
    },

    formatOperationMessage(payload) {
      if (typeof payload?.Response === 'string' && payload.Response.trim()) {
        return payload.Response;
      }
      if (typeof payload?.Message === 'string' && payload.Message.trim()) {
        return payload.Message;
      }
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
      if (typeof payload?.Error === 'string' && payload.Error.trim()) {
        return payload.Error;
      }
      return i18n.global.t('components.flatassistant.operation_failed');
    },

    notifyOperationIssue(payload, type = 'error') {
      useToastStore().showToast({
        type,
        title: i18n.global.t('components.flatassistant.operation_failed'),
        message: this.formatOperationMessage(payload),
        autoClose: true,
        autoCloseDelay: 5000,
      });
    },

    commitRunOutcome(run) {
      let type = 'info';
      let message;

      if (run.total <= 0) {
        if (this.workflowStopRequested) {
          type = 'info';
          message = i18n.global.t('components.flatassistant.status_completed_flats');
        } else {
          type = 'error';
          message = i18n.global.t('components.flatassistant.status_failed_flats');
        }
      } else if (run.success) {
        type = 'success';
        message = i18n.global.t(
          run.type === 'darks'
            ? 'components.flatassistant.status_success_darks'
            : 'components.flatassistant.status_success_flats',
          { count: run.total }
        );
      } else if (run.completed > 0 && this.workflowStopRequested) {
        // User explicitly stopped the run with some flats already taken
        type = 'warning';
        message = i18n.global.t(
          run.type === 'darks'
            ? 'components.flatassistant.status_stopped_darks'
            : 'components.flatassistant.status_stopped_flats',
          { completed: run.completed, total: run.total }
        );
      } else if (
        run.type === 'flats-multi' &&
        run.failedFilterNames?.length > 0 &&
        run.completed > 0
      ) {
        // Partial failure: some filters succeeded, some failed
        type = 'warning';
        message = i18n.global.t('components.flatassistant.status_partial_flats_multi', {
          filters: run.failedFilterNames.join(', '),
        });
      } else {
        type = 'error';
        message = i18n.global.t(
          run.type === 'darks'
            ? 'components.flatassistant.status_failed_darks'
            : run.type === 'flats-multi'
              ? 'components.flatassistant.status_failed_flats_multi'
              : 'components.flatassistant.status_failed_flats'
        );
      }

      this.lastRunOutcome = { type, message };

      if (type !== 'info') {
        useToastStore().showToast({
          type,
          title: i18n.global.t('components.flatassistant.title'),
          message,
          autoClose: true,
          autoCloseDelay: 10000,
        });
      }
    },

    async waitForCompletion(statusLoader, pollMs = 1000, { gracePollLimit } = {}) {
      let seenRunning = false;
      let pollCount = 0;
      let consecutiveNonRunning = 0;
      let peakRunningCompleted = -1;
      let peakRunningTotal = 0;

      while (!this.workflowStopRequested) {
        const response = await statusLoader();
        const status = response?.Response ?? response;
        pollCount++;

        if (status) {
          this.status = status;

          if (status.CurrentADU !== null && status.CurrentADU !== undefined) {
            this.currentADU = Math.round(status.CurrentADU);
          }

          if (status.State === 'Running') {
            seenRunning = true;
            consecutiveNonRunning = 0;
            if (Number(status.TotalIterations) > 0) {
              peakRunningCompleted = Number(status.CompletedIterations);
              peakRunningTotal = Number(status.TotalIterations);
            }
          } else {
            consecutiveNonRunning++;
          }

          const isMultiMode = this.currentRunType === 'flats-multi';
          const effectiveGrace = gracePollLimit ?? (isMultiMode ? 30 : 5);
          const pastStartupGrace = seenRunning || pollCount >= effectiveGrace;
          const terminalState = isMultiMode
            ? consecutiveNonRunning >= 3
            : status.State === 'Finished' || consecutiveNonRunning >= 5;

          if (pastStartupGrace && terminalState) {
            let completed, total;
            if (peakRunningTotal > 0) {
              total = peakRunningTotal;
              // NINA reports T=-1, C=-1 in Finished (no count info). If C > 0 but
              // C < total at the last Running poll, the final flat completed between
              // polls — credit all. Require C > 0 so a never-incremented C=0 at
              // Finished (NINA failed/rejected the flat) is not falsely credited.
              const ninaFinishedNegative =
                status.State === 'Finished' && Number(status.TotalIterations) < 0;
              completed =
                ninaFinishedNegative &&
                peakRunningCompleted > 0 &&
                peakRunningCompleted < peakRunningTotal
                  ? peakRunningTotal
                  : peakRunningCompleted;
            } else {
              completed = Math.max(0, Number(status.CompletedIterations) || 0);
              total = Math.max(0, Number(status.TotalIterations) || 0);
            }
            return { status, completed, total };
          }
        }

        await wait(pollMs);
      }

      // Stopped by user — return whatever peak info we have
      const completed = peakRunningTotal > 0 ? peakRunningCompleted : 0;
      const total = peakRunningTotal > 0 ? peakRunningTotal : 0;
      return { status: this.status, completed, total };
    },

    async runFlatWorkflow({
      request,
      statusLoader = () => apiService.flatassistantAction('status'),
      darkJobs = [],
      keepClosed = false,
      runType = 'flats',
    }) {
      this.startManagedRun(runType);

      const response = await request();
      if (response?.Success === false) {
        this.notifyOperationIssue(response, 'warning');
        return null;
      }

      const { status: finalStatus, completed, total } = await this.waitForCompletion(statusLoader);

      this.lastRun = {
        type: this.currentRunType,
        completed,
        total,
        success: total > 0 && completed >= total,
        lastADU: this.currentADU,
      };

      if (darkJobs.length > 0 && this.shouldOfferDarks(finalStatus)) {
        await this.runDarkSeries(darkJobs, keepClosed);
      }

      return finalStatus;
    },

    async stopWorkflow() {
      this.workflowStopRequested = true;
      return Promise.allSettled([
        apiService.flatassistantAction('stop'),
        apiService.flatMultiStop(),
      ]);
    },

    async ensureFlatDeviceConnected() {
      const store = apiStore();
      if (store.flatdeviceInfo?.Connected) {
        return false;
      }
      try {
        const listResponse = await apiService.flatdeviceAction('list-devices');
        const devices = listResponse?.Response;
        if (!Array.isArray(devices)) return false;
        const simulator = devices.find(
          (d) =>
            d.Name?.toLowerCase().includes('simulator') || d.Id?.toLowerCase().includes('simulator')
        );
        if (!simulator) return false;
        const encodedId = encodeURIComponent(simulator.Id);
        const connectResponse = await apiService.flatdeviceAction('connect?to=' + encodedId);
        return connectResponse?.Success === true;
      } catch {
        return false;
      }
    },

    async disconnectFlatDevice() {
      try {
        await apiService.flatdeviceAction('disconnect');
      } catch {
        // best-effort cleanup
      }
    },

    async runDarkSeries(jobs, keepClosed = false) {
      const validJobs = jobs.filter((job) => Number(job?.count) > 0);
      if (!validJobs.length || this.workflowStopRequested) {
        return null;
      }

      const confirmed = await useToastStore().showConfirmation(
        i18n.global.t('components.flatassistant.cover_scope_title'),
        i18n.global.t('components.flatassistant.cover_scope_message'),
        i18n.global.t('components.flatassistant.cover_scope_confirm'),
        i18n.global.t('common.cancel')
      );

      if (!confirmed) {
        return null;
      }

      // Connect simulator flat device if none is connected (needed by trained-dark-flat API)
      const connectedSimulator = await this.ensureFlatDeviceConnected();

      let totalRequested = 0;
      let totalCompleted = 0;
      let allSucceeded = true;
      let lastADU = this.currentADU;

      for (const job of validJobs) {
        if (this.workflowStopRequested) {
          break;
        }

        totalRequested += Number(job.count) || 0;
        this.startManagedRun('darks');

        const response = await apiService.flatTrainedDarkFlat(
          job.count,
          job.binning,
          job.gain,
          job.offset,
          job.filterId,
          keepClosed
        );

        if (response?.Success === false) {
          allSucceeded = false;
          this.notifyOperationIssue(response, 'warning');
          continue;
        }

        const { status: finalStatus, completed: darkCompleted } = await this.waitForCompletion(() =>
          apiService.flatassistantAction('status')
        );

        totalCompleted += darkCompleted;
        lastADU = this.currentADU;

        if (!this.didRunSucceed(finalStatus)) {
          allSucceeded = false;
        }
      }

      // Disconnect simulator if we connected it
      if (connectedSimulator) {
        await this.disconnectFlatDevice();
      }

      if (totalRequested > 0) {
        this.lastRun = {
          type: 'darks',
          completed: totalCompleted,
          total: totalRequested,
          success: allSucceeded && totalCompleted >= totalRequested,
          lastADU,
        };
      }

      return this.lastRun;
    },

    startFetchingFlats() {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.fetchFlatsInfos, 1000);
      }
    },

    stopFetchingFlats() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
