<script lang="ts">
  import Switcher from "carbon-components-svelte/UIShell/Switcher.svelte";
  import SwitcherDivider from "carbon-components-svelte/UIShell/SwitcherDivider.svelte";
  import SwitcherItem from "carbon-components-svelte/UIShell/SwitcherItem.svelte";

  export let expanded = true;
</script>

<Switcher aria-label="Switcher" {expanded}>
  <SwitcherItem href="/one">Item one</SwitcherItem>
  <SwitcherItem href="/two" isSelected>Item two</SwitcherItem>
  <SwitcherDivider />
  <SwitcherItem href="/three">Item three</SwitcherItem>
</Switcher>
