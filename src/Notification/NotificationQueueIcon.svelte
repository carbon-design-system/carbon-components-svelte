<script>
  // Internal: the status icon of a queued toast, or a spinner while its
  // `promise()` is pending. Not part of the public API.

  /** @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} */
  export let kind = "error";

  export let lowContrast = false;

  /** @type {string | undefined} */
  export let statusIconDescription = undefined;

  export let loading = false;

  import Loading from "../Loading/Loading.svelte";
  import NotificationIcon from "./NotificationIcon.svelte";
  import { statusIconLabel } from "./status-icon-label.js";
</script>

{#if loading}
  <!-- The title says what is loading, so the spinner stays out of the way. -->
  <div
    aria-hidden="true"
    class:bx--toast-notification__icon={true}
    class:bx--toast-notification__loading={true}
  >
    <Loading small withOverlay={false} />
  </div>
{:else}
  <NotificationIcon
    {kind}
    {lowContrast}
    iconDescription={statusIconDescription || statusIconLabel(kind)}
  />
{/if}
