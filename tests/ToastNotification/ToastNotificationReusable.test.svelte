<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let timeout: ComponentProps<ToastNotification>["timeout"] = 0;
  export let title: ComponentProps<ToastNotification>["title"] = "Error";
  export let subtitle: ComponentProps<ToastNotification>["subtitle"] =
    "An internal server error occurred.";
  export let caption: ComponentProps<ToastNotification>["caption"] =
    "2024-03-21 12:00:00";
</script>

<ToastNotification
  bind:open
  {timeout}
  {title}
  {subtitle}
  {caption}
  on:close={(e) => {
    console.log("close", e.detail);
  }}
/>
