import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import copy from "rollup-plugin-copy";

export default {
  input: "src/main.ts",
  output: {
    dir: "./dist",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian", "electron"],
  plugins: [
    typescript(),
    nodeResolve({ browser: false }),
    commonjs(),
    json(),
    copy({
      targets: [{ src: "manifest.json", dest: "dist" }],
      hook: 'buildStart',
    })
  ],
};
