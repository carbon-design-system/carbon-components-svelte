<script lang="ts">
import { Theme } from "carbon-components-svelte";
</script>

<Theme
  render="toggle"
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
