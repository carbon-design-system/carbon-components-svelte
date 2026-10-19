<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let onChange: (detail: number) => void = () => {};
  export let second = false;
  export let selectedIndex = 0;
</script>

<ContentSwitcher bind:selectedIndex on:change={(e) => onChange(e.detail)}>
  <Switch text="A" />
  <Switch text="B" selected={second} />
  <Switch text="C" />
</ContentSwitcher>

<div data-testid="selected-index">{selectedIndex}</div>
