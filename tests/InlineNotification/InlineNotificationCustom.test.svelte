<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";

  export let timeout = 0;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<InlineNotification
  kind="warning"
  {timeout}
  on:close={(event) => onclose?.(event)}
>
  <svelte:fragment slot="actions">
    <NotificationActionButton>Learn more</NotificationActionButton>
  </svelte:fragment>
</InlineNotification>
