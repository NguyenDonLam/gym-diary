const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function patchLiveActivityImports() {
  const relativePath = "node_modules/expo-widgets/ios/LiveActivity.swift";
  const filePath = path.join(root, relativePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-widgets] missing ${relativePath}`);
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");
  let next = source.replace(
    /^import Foundation\nimport Foundation\n/,
    "import Foundation\n",
  );

  if (!next.startsWith("import Foundation\n")) {
    next = next.replace(
      /^import ExpoModulesCore\n/,
      "import Foundation\nimport ExpoModulesCore\n",
    );
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next);
    console.log(`[patch-expo-widgets] patched ${relativePath}`);
  }
}

function patchFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-widgets] missing ${relativePath}`);
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");
  let next = source;

  for (const [before, after] of replacements) {
    if (!next.includes(before)) {
      if (next.includes(after)) continue;

      throw new Error(
        `[patch-expo-widgets] could not find expected source in ${relativePath}`,
      );
    }

    next = next.split(before).join(after);
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next);
    console.log(`[patch-expo-widgets] patched ${relativePath}`);
  }
}

patchLiveActivityImports();

patchFile("node_modules/expo-widgets/ios/LiveActivity.swift", [
  [
    `final class LiveActivity: SharedObject {
  let id: String
  let name: String
  private var pushTokenObserverTask: Task<Void, Never>?

  init(id: String, name: String) {`,
    `final class LiveActivity: SharedObject {
  let id: String
  let name: String
  private var pushTokenObserverTask: Task<Void, Never>?

  static func staleDate(fromProps props: String) -> Date? {
    guard
      let data = props.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
      let restEndsAtMs = json["restEndsAtMs"] as? NSNumber
    else {
      return nil
    }

    let staleDate = Date(timeIntervalSince1970: restEndsAtMs.doubleValue / 1000)
    return staleDate > Date() ? staleDate : nil
  }

  init(id: String, name: String) {`,
  ],
  [
    "    await activity.update(ActivityContent(state: newState, staleDate: nil))",
    "    await activity.update(ActivityContent(state: newState, staleDate: Self.staleDate(fromProps: props)))",
  ],
  [
    "      content = ActivityContent(state: LiveActivityAttributes.ContentState(name: name, props: props), staleDate: nil)",
    "      content = ActivityContent(state: LiveActivityAttributes.ContentState(name: name, props: props), staleDate: Self.staleDate(fromProps: props))",
  ],
]);

patchFile("node_modules/expo-widgets/ios/LiveActivityFactory.swift", [
  [
    `      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let activity = try Activity.request(
        attributes: LiveActivityAttributes(),
        content: .init(state: initialState, staleDate: nil),
        pushType: LiveActivityFactory.pushNotificationsEnabled ? .token : nil
      )`,
    `      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let activity = try Activity.request(
        attributes: LiveActivityAttributes(),
        content: .init(state: initialState, staleDate: LiveActivity.staleDate(fromProps: props)),
        pushType: LiveActivityFactory.pushNotificationsEnabled ? .token : nil
      )`,
  ],
]);

patchFile("node_modules/expo-widgets/ios/Widgets/WidgetLiveActivity.swift", [
  [
    `  func liveActivityEnvironment(isStale: Bool) -> [String: Any] {
    var environment = environment
    environment["isStale"] = isStale
    return environment
  }`,
    `  func liveActivityEnvironment(isStale: Bool) -> [String: Any] {
    var liveActivityEnvironment = environment
    liveActivityEnvironment["isStale"] = isStale
    return liveActivityEnvironment
  }`,
  ],
  [
    `  var environment: [String: Any] {
    return getLiveActivityEnvironment(environment: env)
  }

  public init() {}`,
    `  var environment: [String: Any] {
    return getLiveActivityEnvironment(environment: env)
  }

  func liveActivityEnvironment(isStale: Bool) -> [String: Any] {
    var liveActivityEnvironment = environment
    liveActivityEnvironment["isStale"] = isStale
    return liveActivityEnvironment
  }

  public init() {}`,
  ],
  [
    `        environment: environment
      )`,
    `        environment: liveActivityEnvironment(isStale: context.isStale)
      )`,
  ],
]);
