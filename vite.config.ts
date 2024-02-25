/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import packageJson from "./package.json";

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/-./g, char => char[1].toUpperCase());
  } catch (err) {
    throw new Error("Name property in package.json is missing.");
  }
};
type FormatType = "es" | "umd";
const fileName: Record<FormatType, string> = {
  es: `${getPackageName()}.mjs`,
  umd: `${getPackageName()}.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

module.exports = defineConfig({
  base: "./",
  build: {
    outDir: "./build/dist",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: getPackageNameCamelCase(),
      formats,
      fileName: format => fileName[format as FormatType],
    },
  },
  test: {},
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      { find: "@@", replacement: path.resolve(__dirname) },
    ],
  },
});
