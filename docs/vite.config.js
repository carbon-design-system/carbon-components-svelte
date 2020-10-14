module.exports = {
  optimizeDeps: {
    include: [
      "flatpickr",
      "flatpickr/dist/plugins/rangePlugin",
      "clipboard-copy",
    ],
    exclude: ["@sveltech/routify"],
  },
};
