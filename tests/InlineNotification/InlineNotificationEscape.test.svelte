<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";

  export let hideCloseButton = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<InlineNotification
  title="Escape test"
  {hideCloseButton}
  on:close={(e) => onclose?.(e)}
>
  <input aria-label="Nested field">
</InlineNotification>
