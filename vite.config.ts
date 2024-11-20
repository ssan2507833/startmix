/// <reference types="vitest/config" />

import { vitePlugin as remix } from "@remix-run/dev";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

const MODE = process.env.NODE_ENV;

export default defineConfig({
  build: {
    cssMinify: MODE === "production",

    rollupOptions: {
      external: [/node:.*/, "fsevents"],
    },

    assetsInlineLimit: (source: string) => {
      if (
        source.endsWith("sprite.svg") ||
        source.endsWith("favicon.svg") ||
        source.endsWith("apple-touch-icon.png")
      ) {
        return false;
      }
    },

    sourcemap: true,
  },
  server: {
    watch: {
      ignored: ["**/playwright-report/**"],
    },
  },
  plugins: [
    process.env.NODE_ENV === "test"
      ? null
      : remix({
          ignoredRouteFiles: ["**/*"],
          serverModuleFormat: "esm",
          future: {
            v3_singleFetch: true,
            unstable_optimizeDeps: true,
            v3_fetcherPersist: true,
            v3_relativeSplatPath: true,
            v3_throwAbortReason: true,
            v3_lazyRouteDiscovery: true,
          },
          routes: async (defineRoutes) => {
            return flatRoutes("routes", defineRoutes, {
              ignoredRouteFiles: [
                ".*",
                "**/*.css",
                "**/*.test.{js,jsx,ts,tsx}",
                "**/__*.*",
                // This is for server-side utilities you want to colocate
                // next to your routes without making an additional
                // directory. If you need a route that includes "server" or
                // "client" in the filename, use the escape brackets like:
                // my-route.[server].tsx
                "**/*.server.*",
                "**/*.client.*",
              ],
            });
          },
        }),
    tsconfigPaths(),
  ],
  test: {
    include: ["./app/**/*.test.{ts,tsx}"],
    // setupFiles: ["./tests/setup/setup-test-env.ts"],
    // globalSetup: ["./tests/setup/global-setup.ts"],
    restoreMocks: true,
    coverage: {
      include: ["app/**/*.{ts,tsx}"],
      all: true,
    },
  },
});
