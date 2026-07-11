const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");

config.watchFolders = [path.resolve(workspaceRoot, "packages")];
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter(
    (ext) => ext !== "tsx" && ext !== "ts" && ext !== "sql",
  ),
  "tsx",
  "ts",
  "sql",
];

module.exports = withNativeWind(config, { input: "./global.css" });
