import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    include: ["clipboard-copy", "flatpickr/dist/plugins/rangePlugin"],
    exclude: [
      "carbon-components-svelte",
      "carbon-icons-svelte",
      "@sveltech/routify",
    ],
  },
});
