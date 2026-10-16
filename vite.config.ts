import { defineConfig, loadEnv } from "vite";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { isDebugBuild } from "./vite.debug.ts";
import { createResolveOptions } from "./config/vite/resolution.ts";
import { createAppLogger } from "./config/vite/logger.ts";
import { createAssetPlugin } from "./config/vite/assetPlugin.ts";
import { createIconMiddleware } from "./config/vite/iconMiddleware.ts";
import { createAutoImportPlugins } from "./config/vite/autoImportPlugin.ts";
import { createBuildOptions } from "./config/vite/buildOptions.ts";
import { optimizeDeps } from "./config/vite/optimizeDeps.ts";

export default defineConfig(({ command, mode }) => ({
  customLogger: createAppLogger(),
  base: "./",
  define: {
    __GOOSE_EDITOR_COMPACT__: false,
    __GOOSE_EDITOR_AI__: true,
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(
      command === "serve"
        ? JSON.parse(
            readFileSync(new URL("./package.json", import.meta.url), "utf8"),
          ).version
        : loadEnv(mode, import.meta.dirname, "").VITE_APP_VERSION,
    ),
  },
  plugins: [
    createAssetPlugin(import.meta.dirname),
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true,
      hideDomPathAttr: true,
    }),
    react(),
    ...createAutoImportPlugins(),
    createIconMiddleware(),
  ],
  resolve: createResolveOptions(import.meta.dirname),
  optimizeDeps,
  server: { host: "0.0.0.0", port: 6001, sourcemapIgnoreList: false },
  build: createBuildOptions(import.meta.dirname),
  logLevel: isDebugBuild ? "info" : "warn",
}));
