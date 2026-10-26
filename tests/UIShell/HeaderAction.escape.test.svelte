<script lang="ts">
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";

  export let isOpen = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <HeaderAction bind:isOpen iconDescription="Notifications" icon={Notification}>
    <a href="#alerts">Alert settings</a>
  </HeaderAction>
  <input aria-label="Other control" />
</div>
