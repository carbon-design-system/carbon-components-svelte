<script lang="ts">
import { ToastNotification } from "carbon-components-svelte";
</script>

<ToastNotification
  title="Custom"
  subtitle="Message"
  caption="2024-03-21 12:00:00"
  on:close={(e) => {
    e.preventDefault();
    console.log("close", e.detail);
  }}
/>
