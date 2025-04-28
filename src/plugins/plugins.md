# Touch 'N' Stars Plugin System

## Overview
The plugin system allows you to extend Touch 'N' Stars with additional features through plugins. Each plugin is a self-contained module that can include its own views, components, and stores.

## Plugin Structure
```
plugins/
  my-plugin/
    index.js           # Plugin entry point
    plugin.json        # Plugin metadata
    components/        # Plugin-specific components
    views/             # Plugin-specific views
    store/             # Plugin-specific store modules
```

## Plugin Metadata (plugin.json)
```json
{
  "id": "unique-plugin-id",
  "name": "Plugin Display Name",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": "Author Name",
  "enabled": false
}
```

## Plugin Entry Point (index.js)
```javascript
// Import your icon directly in your plugin
import { YourIconComponent } from '@heroicons/vue/24/outline';
// Or create/import a custom icon component
// import MyCustomIcon from './components/MyCustomIcon.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';
import MyPluginView from './views/MyPluginView.vue';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;
    
    // Register routes
    router.addRoute({
      path: '/my-plugin',
      component: MyPluginView,
      meta: { requiresSetup: true },
    });
    
    // Register plugin metadata
    pluginStore.registerPlugin(metadata);
    
    // Add navigation item only if plugin is enabled
    if (metadata.enabled) {
      pluginStore.addPluginNavigationItem(metadata.id, {
        path: '/my-plugin',
        icon: YourIconComponent,  // Each plugin provides its own icon
        title: metadata.name,
      });
    }
  }
}
```

## Creating a New Plugin

1. Create a new folder in the plugins directory with your plugin name (e.g., `my-plugin`)
2. Create a `plugin.json` file with your plugin metadata
3. Create an `index.js` file as the entry point
4. Add your components, views, and stores
5. The plugin will be automatically discovered and listed in the settings

That's it! No manual registration is required. The system will automatically discover your plugin when the app is built or served.

## Plugin Auto-Discovery

Touch 'N' Stars features an automatic plugin discovery system. When you add a new plugin folder with the correct structure, it gets automatically detected and included in the plugin registry during the build process.

This is handled by a build script that:
1. Scans the plugins directory for valid plugin folders
2. Verifies each folder has the required files (index.js and plugin.json)
3. Generates a registry file with imports for all plugins

### Available NPM Scripts

- `npm run generate-plugins` - Manually regenerate the plugin registry
- During build and serve commands, the plugin registry is automatically updated

## Icon Support

Your plugin can use any icon from `@heroicons/vue/24/outline` or provide custom icon components:

```javascript
// Using HeroIcons
import { SparklesIcon } from '@heroicons/vue/24/outline';

// Or using your own custom icon component
import MyCustomIcon from './components/MyCustomIcon.vue';

// Then in your plugin install function:
pluginStore.addPluginNavigationItem(metadata.id, {
  path: '/my-plugin',
  icon: SparklesIcon,  // or MyCustomIcon
  title: metadata.name,
});
```

## Example
See the example weather station plugin in `plugins/weather-station/` for a complete implementation.

## Guidelines
- Each plugin should be self-contained
- Use unique identifiers for your plugin
- Follow Vue 3 composition API patterns
- Use Tailwind CSS for styling
- Test your plugin thoroughly before distribution