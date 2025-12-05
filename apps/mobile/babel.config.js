const path = require("path");

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          alias: {
            "@": "./",
            "@packages": path.resolve(__dirname, "../../packages"),
          },
        },
      ],
      ["inline-import", { extensions: [".sql"] }],
    ],
  };
};
