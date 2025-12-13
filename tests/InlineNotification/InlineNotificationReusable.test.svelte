<script lang="ts">
  import { InlineNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let timeout: ComponentProps<InlineNotification>["timeout"] = 0;
  export let title: ComponentProps<InlineNotification>["title"] = "Error:";
  export let subtitle: ComponentProps<InlineNotification>["subtitle"] =
    "An internal server error occurred.";
</script>

<InlineNotification
  bind:open
  {timeout}
  {title}
  {subtitle}
  on:close={(e) => {
    console.log("close", e.detail);
  }}
/>
