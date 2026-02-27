import { defineStore } from 'pinia';

export const usePinsStore = defineStore('pins', {
  state: () => ({
    savedWifiPasswords: {}, // Object map: SSID -> Password
    timeSyncEnabled: false,
  }),
  actions: {
    setTimeSync(enabled) {
      this.timeSyncEnabled = enabled;
    },
    savePassword(ssid, password) {
      if (!ssid) return;
      this.savedWifiPasswords[ssid] = password;
    },
    getPassword(ssid) {
      if (!ssid) return '';
      return this.savedWifiPasswords[ssid] || '';
    },
    removePassword(ssid) {
      if (!ssid) return;
      delete this.savedWifiPasswords[ssid];
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'pins-plugin-store',
        storage: localStorage,
      },
    ],
  },
});
