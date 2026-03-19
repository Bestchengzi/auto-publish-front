import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    main: "src/main.ts",
    preload: "src/preload.ts"
  },
  outDir: "dist",
  format: ["cjs"],
  sourcemap: true,
  clean: true,
  dts: false,
  target: "node18",
  platform: "node",
  external: ["electron"]
});

