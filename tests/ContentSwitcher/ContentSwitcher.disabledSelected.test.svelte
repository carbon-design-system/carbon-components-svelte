<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import type { ComponentProps } from "svelte";

  export let disabledFirst = true;
  export let allDisabled = false;
  export let selectionMode: ComponentProps<ContentSwitcher>["selectionMode"] =
    "automatic";
</script>

<button type="button">before</button>
<ContentSwitcher
  {selectionMode}
  on:change={(e) => console.log("change", e.detail)}
>
  <Switch text="A" disabled={disabledFirst || allDisabled} />
  <Switch text="B" disabled={allDisabled} />
  <Switch text="C" disabled={allDisabled} />
</ContentSwitcher>
