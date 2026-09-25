// flatpickr only ships typings for its CJS plugin entry points
// (`flatpickr/dist/plugins/*`), not the ESM ones actually imported
// at runtime (`flatpickr/dist/esm/plugins/*`). Bare ambient module
// declarations let those dynamic imports type-check as `any`,
// matching the implicit-`any` behavior before `// @ts-check`.
declare module "flatpickr/dist/esm/plugins/rangePlugin";
declare module "flatpickr/dist/esm/plugins/monthSelect";
declare module "flatpickr/dist/esm/plugins/weekSelect/weekSelect";
