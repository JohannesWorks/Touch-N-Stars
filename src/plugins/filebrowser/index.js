import { h, markRaw } from 'vue';
import DefaultPluginView from './views/filebrowser.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

const FolderIcon = markRaw({
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
        'stroke-width': '1.5',
        stroke: 'currentColor',
      },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: 'M3.75 7.5a2.25 2.25 0 012.25-2.25h3.326a2.25 2.25 0 011.591.659l.849.848c.422.422.995.659 1.591.659H18a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5V7.5z',
        }),
      ]
    );
  },
});

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;
    const currentPlugin = pluginStore.plugins.find((plugin) => plugin.id === metadata.id);
    if (!currentPlugin) return;

    router.addRoute({
      path: currentPlugin.pluginPath,
      component: DefaultPluginView,
      meta: { requiresSetup: true },
    });

    if (currentPlugin.enabled) {
      pluginStore.addPluginNavigationItem(metadata.id, {
        path: currentPlugin.pluginPath,
        icon: FolderIcon,
        title: metadata.name,
      });
    }
  },
};
