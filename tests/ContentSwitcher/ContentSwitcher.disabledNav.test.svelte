<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selectionMode: ComponentProps<ContentSwitcher>["selectionMode"] =
    "automatic";
</script>

<ContentSwitcher {selectionMode}>
  <Switch text="A" />
  <Switch text="B" disabled />
  <Switch text="C" />
  <Switch text="D" disabled />
</ContentSwitcher>
