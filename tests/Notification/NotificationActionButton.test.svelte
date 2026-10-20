<script lang="ts">
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";

  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<NotificationActionButton on:click={(e) => onclick?.(e)} {...$$restProps}>
  Undo
</NotificationActionButton>
