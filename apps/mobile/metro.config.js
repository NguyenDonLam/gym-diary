const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const { limitMetroCache } = require("./scripts/limit-metro-cache");

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");

if (process.platform === "win32") {
  config.cacheStores = limitMetroCache(config.cacheStores);
}

config.watchFolders = [path.resolve(workspaceRoot, "packages")];
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter((ext) => ext !== "tflite"),
  "tflite",
];
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter(
    (ext) => ext !== "tsx" && ext !== "ts" && ext !== "sql",
  ),
  "tsx",
  "ts",
  "sql",
];

module.exports = withNativeWind(config, { input: "./global.css" });
