<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
</script>

<ToastNotification on:close on:click>
  <span slot="title">Slot title</span>
</ToastNotification>
