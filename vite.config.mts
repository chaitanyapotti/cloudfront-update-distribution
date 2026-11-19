import { nodeLintPreset } from "@toruslabs/oxlint-config-node";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...formatPreset(),
    ignorePatterns: ["**/dist/**", "package-lock.json"],
  },
  lint: nodeLintPreset(),
  // ncc-style bundle: one self-contained CJS file per action entry.
  environments: {
    ssr: {
      resolve: {
        // inline @actions/core and @aws-sdk/client-cloudfront into the bundle
        noExternal: true,
      },
    },
  },
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      output: {
        format: "cjs",
        entryFileNames: "index.js",
        inlineDynamicImports: true,
      },
    },
  },
});
