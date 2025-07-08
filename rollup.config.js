import typescript from "@rollup/plugin-typescript";

export default {
  input: "web/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.mjs",
      format: "esm",
    },
  ],
  plugins: [typescript()],
};
