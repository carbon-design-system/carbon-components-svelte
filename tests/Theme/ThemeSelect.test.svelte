<script lang="ts">
  import { Theme } from "carbon-components-svelte";
</script>

<Theme
  render="select"
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
