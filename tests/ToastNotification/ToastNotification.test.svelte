<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<ToastNotification>["kind"] = "error";
  export let lowContrast = false;
  export let timeout = 0;
  export let role = "alert";
  export let title = "Error";
  export let subtitle = "An internal server error occurred.";
  export let caption = "2024-03-21 12:00:00";
  export let hideCloseButton = false;
  export let fullWidth = false;
  export let statusIconDescription = "";
  export let closeButtonDescription = "";
</script>

<ToastNotification
  {kind}
  {lowContrast}
  {timeout}
  {role}
  {title}
  {subtitle}
  {caption}
  {hideCloseButton}
  {fullWidth}
  {statusIconDescription}
  {closeButtonDescription}
  on:close={(e) => {
    console.log("close", e.detail);
  }}
/>
