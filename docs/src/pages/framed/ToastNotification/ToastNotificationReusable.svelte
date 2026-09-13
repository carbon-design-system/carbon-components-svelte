<script>
  import {
    Button,
    ButtonSet,
    Stack,
    ToastNotification,
  } from "carbon-components-svelte";

  let open = false;
  let kind = "error";
  let title = "Session expired";
  let subtitle = "Your session has ended. Please sign in again to continue.";
  let caption = new Date().toLocaleString();

  function showError() {
    kind = "error";
    title = "Session expired";
    subtitle = "Your session has ended. Please sign in again to continue.";
    caption = new Date().toLocaleString();
    open = true;
  }

  function showSuccess() {
    kind = "success";
    title = "Export complete";
    subtitle = "Your report has been exported and is ready for download.";
    caption = new Date().toLocaleString();
    open = true;
  }

  function showWarning() {
    kind = "warning";
    title = "Unsaved changes";
    subtitle =
      "You have unsaved changes that will be lost if you navigate away.";
    caption = new Date().toLocaleString();
    open = true;
  }
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button on:click={showSuccess}>Show success</Button>
    <Button kind="ghost" on:click={showWarning}>Show warning</Button>
    <Button kind="danger-ghost" on:click={showError}>Show error</Button>
  </ButtonSet>

  <ToastNotification bind:open {kind} {title} {subtitle} {caption} />
</Stack>
