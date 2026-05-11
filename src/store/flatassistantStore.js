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
        const next = tnsNext?.State === 'Running' ? tnsNext : (ninaNext ?? tnsNext ?? this.status);

        // A new run is starting — clear the previous result
        if (prevState !== 'Running' && next.State === 'Running') {
          this.lastRun = null;
          this.currentADU = null;
        }

        // ADU comes directly from the flat status response (both Running and Finished states)
        if (next.CurrentADU !== null && next.CurrentADU !== undefined) {
          this.currentADU = Math.round(next.CurrentADU);
        }

        // A run just finished — save a summary so the UI can show the outcome
        if (prevState === 'Running' && next.State === 'Finished') {
          this.commitRunOutcome({
            type: this.currentRunType,
            completed: prevCompleted,
            total: prevTotal,
            success: prevTotal > 0 && prevCompleted >= prevTotal,
            lastADU: this.currentADU,
          });
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
      this.lastRun = run;

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
      } else if (run.completed > 0) {
        type = 'warning';
        message = i18n.global.t(
          run.type === 'darks'
            ? 'components.flatassistant.status_stopped_darks'
            : 'components.flatassistant.status_stopped_flats',
          { completed: run.completed, total: run.total }
        );
      } else {
        type = 'error';
        message = i18n.global.t(
          run.type === 'darks'
            ? 'components.flatassistant.status_failed_darks'
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

    async waitForCompletion(statusLoader, pollMs = 1000) {
      while (!this.workflowStopRequested) {
        const response = await statusLoader();
        const status = response?.Response ?? response;

        if (status) {
          this.status = status;

          if (status.CurrentADU !== null && status.CurrentADU !== undefined) {
            this.currentADU = Math.round(status.CurrentADU);
          }

          if (status.State !== 'Running') {
            this.commitRunOutcome({
              type: this.currentRunType,
              completed: Math.max(0, Number(status.CompletedIterations) || 0),
              total: Math.max(0, Number(status.TotalIterations) || 0),
              success: this.didRunSucceed(status),
              lastADU: this.currentADU,
            });
            return status;
          }
        }

        await wait(pollMs);
      }

      return this.status;
    },

    async runFlatWorkflow({
      request,
      statusLoader = () => apiService.flatassistantAction('status'),
      darkJobs = [],
      keepClosed = false,
    }) {
      this.startManagedRun('flats');

      const response = await request();
      if (response?.Success === false) {
        this.notifyOperationIssue(response, 'warning');
        return null;
      }

      const finalStatus = await this.waitForCompletion(statusLoader);

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

        const finalStatus = await this.waitForCompletion(() =>
          apiService.flatassistantAction('status')
        );

        totalCompleted += Math.max(0, Number(finalStatus?.CompletedIterations) || 0);
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
        this.commitRunOutcome({
          type: 'darks',
          completed: totalCompleted,
          total: totalRequested,
          success: allSucceeded && totalCompleted >= totalRequested,
          lastADU,
        });
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
