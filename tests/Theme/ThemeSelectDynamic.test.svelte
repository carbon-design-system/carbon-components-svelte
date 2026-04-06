<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let themes: NonNullable<ComponentProps<Theme>["select"]>["themes"] =
    [];
  export let labelText = "Themes";
</script>

<Theme
  render="select"
  select={{
    themes,
    labelText,
  }}
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
