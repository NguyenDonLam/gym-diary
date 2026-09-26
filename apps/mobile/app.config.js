module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === "development";

  return {
    ...config,
    name: isDevelopment ? "Gym Diary Dev" : "Gym Diary",
    scheme: isDevelopment ? "mobile-dev" : config.scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: isDevelopment
        ? `${config.ios.bundleIdentifier}.dev`
        : config.ios.bundleIdentifier,
    },
    android: {
      ...config.android,
      package: isDevelopment
        ? `${config.android.package}.dev`
        : config.android.package,
    },
    plugins: [
      ...config.plugins,
      ["expo-dev-client", { addGeneratedScheme: isDevelopment }],
    ],
  };
};
