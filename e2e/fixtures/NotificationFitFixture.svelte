<script>
  import {
    InlineNotification,
    ToastNotification,
  } from "carbon-components-svelte";
</script>

<!-- Notifications in boxes narrower than their usual widths. -->
{#each [200, 320] as width}
  <div data-testid="inline-{width}" style="width: {width}px; margin: 1rem;">
    <InlineNotification
      kind="error"
      title="Deployment finished"
      subtitle="billing-api is live in 3 regions."
    />
  </div>
  <div data-testid="toast-{width}" style="width: {width}px; margin: 1rem;">
    <ToastNotification
      kind="error"
      title="Deployment finished"
      subtitle="billing-api is live in 3 regions."
      timeout={0}
    />
  </div>
{/each}
<!-- A parent that sizes to its content. -->
<div data-testid="inline-shrink" style="display: inline-block; margin: 1rem;">
  <InlineNotification
    kind="error"
    title="Deployment finished"
    subtitle="billing-api is live in 3 regions."
  />
</div>
