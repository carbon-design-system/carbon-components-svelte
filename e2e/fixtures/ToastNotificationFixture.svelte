<script>
  import { ToastNotification } from "carbon-components-svelte";

  let open = true;
</script>

<div class="fixture-container">
  <ToastNotification
    data-testid="toast-notification"
    kind="success"
    title="Toast title"
    subtitle="Toast subtitle"
    bind:open
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
