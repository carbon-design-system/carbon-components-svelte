<script lang="ts">
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
</script>

<ToastNotification on:close on:click>
  <span slot="captionChildren">Slot caption</span>
</ToastNotification>
