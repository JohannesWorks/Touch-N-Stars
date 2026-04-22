import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

const SERVICES = ['pushover', 'telegram', 'email', 'discord', 'slack', 'mqtt', 'ifttt', 'ntfysh'];

const apiNameMap = {
  pushover: 'Pushover',
  telegram: 'Telegram',
  email: 'Email',
  discord: 'Discord',
  slack: 'Slack',
  mqtt: 'Mqtt',
  ifttt: 'Ifttt',
  ntfysh: 'Ntfysh',
};

const initialServiceMap = () =>
  SERVICES.reduce((acc, id) => {
    acc[id] = null;
    return acc;
  }, {});

const initialFlagMap = () =>
  SERVICES.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {});

const initialNullMap = () =>
  SERVICES.reduce((acc, id) => {
    acc[id] = null;
    return acc;
  }, {});

export const useGroundStationStore = defineStore('groundStation', {
  state: () => ({
    pluginInstalled: null,
    pluginVersion: null,
    statusChecked: false,

    activeTab: 'pushover',

    settings: initialServiceMap(),
    loading: initialFlagMap(),
    saving: initialFlagMap(),
    testing: initialFlagMap(),
    errors: initialNullMap(),
    testStatus: initialNullMap(),

    refreshingSlackChannels: false,
    slackRefreshError: null,
  }),

  actions: {
    async initialize() {
      await this.checkStatus();
      if (this.pluginInstalled) {
        await this.loadAll();
      }
    },

    async checkStatus() {
      try {
        const res = await apiService.groundstation.getStatus();
        this.pluginInstalled = res?.Response?.Installed === true;
        this.pluginVersion = res?.Response?.Version ?? null;
      } catch {
        this.pluginInstalled = false;
        this.pluginVersion = null;
      } finally {
        this.statusChecked = true;
      }
    },

    async loadAll() {
      await Promise.all(SERVICES.map((id) => this.loadService(id)));
    },

    async loadService(id) {
      const fn = apiService.groundstation[`get${apiNameMap[id]}`];
      if (!fn) return;
      this.loading[id] = true;
      this.errors[id] = null;
      try {
        const res = await fn();
        if (res?.Success) {
          this.settings[id] = res.Response ?? {};
        } else {
          this.errors[id] = res?.Error ?? 'Failed to load';
        }
      } catch (err) {
        this.errors[id] = err?.message ?? String(err);
      } finally {
        this.loading[id] = false;
      }
    },

    async saveService(id, patch) {
      const fn = apiService.groundstation[`update${apiNameMap[id]}`];
      if (!fn) return false;
      this.saving[id] = true;
      this.errors[id] = null;
      try {
        const res = await fn(patch);
        if (res?.Success === false) {
          this.errors[id] = res?.Error ?? 'Save failed';
          return false;
        }
        // Reload to confirm and pull back any normalized values
        await this.loadService(id);
        return true;
      } catch (err) {
        this.errors[id] = err?.message ?? String(err);
        return false;
      } finally {
        this.saving[id] = false;
      }
    },

    async testService(id) {
      const fn = apiService.groundstation[`test${apiNameMap[id]}`];
      if (!fn) return;
      this.testing[id] = true;
      this.testStatus[id] = null;
      try {
        const res = await fn();
        this.testStatus[id] = {
          ok: res?.Success === true,
          message: res?.Response?.Message ?? res?.Error ?? (res?.Success ? 'OK' : 'Failed'),
        };
      } catch (err) {
        this.testStatus[id] = { ok: false, message: err?.message ?? String(err) };
      } finally {
        this.testing[id] = false;
      }
    },

    clearTestStatus(id) {
      this.testStatus[id] = null;
    },

    async refreshSlackChannels() {
      this.refreshingSlackChannels = true;
      this.slackRefreshError = null;
      try {
        const res = await apiService.groundstation.refreshSlackChannels();
        if (res?.Success && res?.Response) {
          // Merge channels + workspace metadata back into slack settings
          const current = this.settings.slack ?? {};
          this.settings.slack = {
            ...current,
            WorkspaceName: res.Response.WorkspaceName ?? current.WorkspaceName,
            BotName: res.Response.BotName ?? current.BotName,
            BotDisplayName: res.Response.BotDisplayName ?? current.BotDisplayName,
            Channels: res.Response.Channels ?? current.Channels ?? [],
          };
          return true;
        } else {
          this.slackRefreshError = res?.Error ?? 'Refresh failed';
          return false;
        }
      } catch (err) {
        this.slackRefreshError = err?.message ?? String(err);
        return false;
      } finally {
        this.refreshingSlackChannels = false;
      }
    },
  },
});

export { SERVICES };
