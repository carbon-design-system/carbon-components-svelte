<script>
  import { ToastNotification } from "carbon-components-svelte";

  let open = true;
</script>

<ToastNotification
  data-testid="toast-notification"
  kind="success"
  title="Toast title"
  subtitle="Toast subtitle"
  bind:open
/>
