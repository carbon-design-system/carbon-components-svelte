<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<ContentSwitcher>["size"] = undefined;
  export let lowContrast = false;
  export let autoWidth = false;
</script>

<ContentSwitcher {size} {lowContrast} {autoWidth}>
  <Switch text="One" />
  <Switch text="Two" />
</ContentSwitcher>
