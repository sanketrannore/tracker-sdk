import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named"
    },
    {
      file: "dist/index.mjs",
      format: "esm",
      sourcemap: true,
      exports: "named"
    },
    {
      file: "dist/index.min.js",
      format: "umd",
      name: "cruxstack",
      sourcemap: true,
      plugins: [terser()]
    }
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }), 
    commonjs({
      include: /node_modules/
    }), 
    typescript({ 
      declaration: false,
      tsconfig: "./tsconfig.json"
    })
  ],
  external: [
    // Any dependencies that should not be bundled can be added here.
  ]
};
