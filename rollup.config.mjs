import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/web/index.ts",
  output: [
    {
      file: "dist/web/index.js",
      format: "cjs",
    },
    {
      file: "dist/web/index.mjs",
      format: "esm",
    },
  ],
  plugins: [nodeResolve(), commonjs(), typescript({ declaration: false })],
};
