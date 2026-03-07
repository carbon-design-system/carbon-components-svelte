<script>
  import { InlineNotification } from "carbon-components-svelte";

  let open = true;
</script>

<div class="fixture-container">
  <InlineNotification
    data-testid="inline-notification"
    kind="info"
    title="Notification title"
    subtitle="Notification subtitle"
    bind:open
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
