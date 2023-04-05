const path = require("path");

exports.nodeConfig = {
  optimization: {
    minimize: false,
  },
  entry: "./src/index.ts",
  output: {
    path: path.resolve("./dist"),
    filename: `index.js`,
    library: {
      type: "commonjs2",
    },
  },
  target: "node",
};

exports.nodeConfig2 = {
  optimization: {
    minimize: false,
  },
  entry: "./src/cleanup.ts",
  output: {
    path: path.resolve("./dist/cleanup"),
    filename: `index.js`,
    library: {
      type: "commonjs2",
    },
  },
  target: "node",
};
