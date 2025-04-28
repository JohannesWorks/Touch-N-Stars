/**
 * Plugin discovery utility
 * Dynamically discovers all plugins in the plugins directory
 */
import { pluginRegistry } from '@/plugins/pluginRegistry';

/**
 * Get all available plugins
 * @returns {Array} Array of plugin objects
 */
const getAllPlugins = () => {
  return pluginRegistry;
};

/**
 * Load plugin metadata for all available plugins
 * @returns {Promise<Array>} Array of plugin metadata objects
 */
export const loadAllPluginsMetadata = async () => {
  const plugins = getAllPlugins();
  const metadata = [];

  for (const plugin of plugins) {
    try {
      metadata.push({
        ...plugin.metadata,
        id: plugin.id,
      });
    } catch (error) {
      console.error(`Failed to load plugin metadata for ${plugin.id}:`, error);
    }
  }

  return metadata;
};

/**
 * Import a plugin by ID
 * @param {string} pluginId - ID of the plugin to import
 * @returns {Promise<Object|null>} Plugin module or null if not found
 */
export const importPlugin = async (pluginId) => {
  const plugins = getAllPlugins();
  const plugin = plugins.find((p) => p.id === pluginId);

  if (!plugin) {
    return null;
  }

  try {
    return plugin.module;
  } catch (error) {
    console.error(`Failed to import plugin ${pluginId}:`, error);
    return null;
  }
};
