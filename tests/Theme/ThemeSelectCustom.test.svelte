<script lang="ts">
  import { Theme } from "carbon-components-svelte";
</script>

<Theme
  render="select"
  select={{
    themes: ["white", "g90", "g100"],
    labelText: "Select a theme",
    inline: true,
  }}
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
