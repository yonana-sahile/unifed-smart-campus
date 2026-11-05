// src/require-shim.cjs
// Polyfill for `require()` in Vite dev — returns the same as `import`
module.exports = function require(id) {
  if (id === "onnxruntime-web/wasm") {
    return window.ort;
  }
  throw new Error(`require("${id}") not supported in browser`);
};