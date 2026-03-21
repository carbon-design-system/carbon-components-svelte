<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selectionMode: ComponentProps<ContentSwitcher>["selectionMode"] =
    "manual";
</script>

<ContentSwitcher
  {selectionMode}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <Switch text="Option 1" />
  <Switch text="Option 2" />
  <Switch text="Option 3" />
</ContentSwitcher>
