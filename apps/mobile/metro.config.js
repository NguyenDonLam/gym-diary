const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");

config.watchFolders = [path.resolve(workspaceRoot, "packages")];
config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, { input: "./global.css" });
