const { withAndroidManifest } = require("@expo/config-plugins");

const REQUIRED_PERMISSIONS = [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.POST_PROMOTED_NOTIFICATIONS",
];

function ensureUsesPermission(androidManifest, permissionName) {
  const manifest = androidManifest.manifest;
  const usesPermissions = manifest["uses-permission"] ?? [];
  const hasPermission = usesPermissions.some(
    (permission) => permission?.$?.["android:name"] === permissionName,
  );

  if (!hasPermission) {
    usesPermissions.push({
      $: {
        "android:name": permissionName,
      },
    });
  }

  manifest["uses-permission"] = usesPermissions;
}

module.exports = function withWorkoutLiveUpdate(config) {
  return withAndroidManifest(config, (config) => {
    for (const permissionName of REQUIRED_PERMISSIONS) {
      ensureUsesPermission(config.modResults, permissionName);
    }

    return config;
  });
};
