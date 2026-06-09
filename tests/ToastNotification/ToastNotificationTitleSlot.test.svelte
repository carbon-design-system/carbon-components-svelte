<script lang="ts">
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
</script>

<ToastNotification on:close on:click>
  <span slot="titleChildren">Slot title</span>
</ToastNotification>
