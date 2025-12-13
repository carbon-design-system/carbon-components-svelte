<script>
  import {
    Button,
    ButtonSet,
    Stack,
    ToastNotification,
  } from "carbon-components-svelte";

  let open = false;
  let kind = "error";
  let title = "Error";
  let subtitle = "An internal server error occurred.";
  let caption = new Date().toLocaleString();

  function showError() {
    kind = "error";
    title = "Error";
    subtitle = "An internal server error occurred.";
    caption = new Date().toLocaleString();
    open = true;
  }

  function showSuccess() {
    kind = "success";
    title = "Success";
    subtitle = "Your settings have been saved.";
    caption = new Date().toLocaleString();
    open = true;
  }

  function showWarning() {
    kind = "warning";
    title = "Warning";
    subtitle = "Please review your changes before continuing.";
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
