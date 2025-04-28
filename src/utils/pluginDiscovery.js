/**
 * Plugin discovery utility
 * Dynamically discovers all plugins in the plugins directory
 */
import { CloudIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import { pluginRegistry } from '@/plugins/pluginRegistry';

// Import all plugin icon components that might be used
const iconComponents = {
  CloudIcon,
  SparklesIcon,
  // Add more icons as needed
};

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
 * Get the icon component for a plugin
 * @param {string} iconName - Name of the icon from metadata
 * @returns {Component|null} Vue component for the icon or null if not found
 */
export const getIconComponent = (iconName) => {
  if (!iconName || typeof iconName !== 'string') {
    return null;
  }

  return iconComponents[iconName] || null;
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
