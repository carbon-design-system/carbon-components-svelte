<script lang="ts">
  import { InlineNotification } from "carbon-components-svelte";
</script>

<InlineNotification
  title="Error"
  subtitle="An internal server error occurred."
  on:close={(e) => {
    e.preventDefault();
    console.log("close", e.detail);
  }}
/>
