const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
const config = getDefaultConfig(__dirname);


// Add assets to the asset include patterns
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');
config.watchFolders = [...(config.watchFolders || []), './assets'];

// Firebase compatibility fixes for Expo SDK 53
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

return config;
})();