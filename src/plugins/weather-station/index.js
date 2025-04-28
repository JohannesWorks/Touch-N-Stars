import { CloudIcon } from '@heroicons/vue/24/outline';
import WeatherStationView from './views/WeatherStationView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Register route
    router.addRoute({
      path: '/weather-station',
      component: WeatherStationView,
      meta: { requiresSetup: true },
    });

    // Register plugin metadata
    pluginStore.registerPlugin(metadata);

    // Add navigation item only if plugin is enabled
    if (metadata.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: '/weather-station',
        icon: CloudIcon,
        title: metadata.name,
      });
    }
  },
};
