<script>
  import {
    Button,
    ButtonSet,
    InlineNotification,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
  let kind = "error";
  let title = "Error:";
  let subtitle = "An internal server error occurred.";

  function showError() {
    kind = "error";
    title = "Save failed:";
    subtitle =
      "Your changes could not be saved. Check your connection and try again.";
    open = true;
  }

  function showSuccess() {
    kind = "success";
    title = "Success:";
    subtitle = "Changes saved successfully.";
    open = true;
  }

  function showWarning() {
    kind = "warning";
    title = "Warning:";
    subtitle = "Some fields require your attention before you continue.";
    open = true;
  }
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button on:click={showSuccess}>Show success</Button>
    <Button kind="ghost" on:click={showWarning}>Show warning</Button>
    <Button kind="danger-ghost" on:click={showError}>Show error</Button>
  </ButtonSet>

  <InlineNotification bind:open {kind} {title} {subtitle} />
</Stack>
