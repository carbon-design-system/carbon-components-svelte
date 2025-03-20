<script lang="ts">
  import { InlineNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<InlineNotification>["kind"] = "error";
  export let lowContrast = false;
  export let timeout = 0;
  export let role = "alert";
  export let title = "Error:";
  export let subtitle = "An internal server error occurred.";
  export let hideCloseButton = false;
  export let statusIconDescription = "";
  export let closeButtonDescription = "";
</script>

<InlineNotification
  {kind}
  {lowContrast}
  {timeout}
  {role}
  {title}
  {subtitle}
  {hideCloseButton}
  {statusIconDescription}
  {closeButtonDescription}
  on:close={(e) => {
    console.log("close", e.detail);
  }}
/>
