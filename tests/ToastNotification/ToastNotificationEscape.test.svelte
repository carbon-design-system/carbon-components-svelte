<script lang="ts">
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  export let hideCloseButton = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ToastNotification
  title="Escape test"
  {hideCloseButton}
  on:close={(e) => onclose?.(e)}
>
  <input aria-label="Nested field">
</ToastNotification>
