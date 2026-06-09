<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
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
