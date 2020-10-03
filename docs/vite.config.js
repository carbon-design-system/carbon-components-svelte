module.exports = {
  optimizeDeps: {
    include: [
      "flatpickr",
      "flatpickr/dist/l10n/index.js",
      "flatpickr/dist/plugins/rangePlugin",
      "clipboard-copy",
    ],
    exclude: ["@sveltech/routify"],
  },
};
