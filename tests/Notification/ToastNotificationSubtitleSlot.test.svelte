<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
</script>

<ToastNotification on:close on:click>
  <span slot="subtitle">Slot subtitle</span>
</ToastNotification>
