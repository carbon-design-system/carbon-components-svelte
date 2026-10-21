<script lang="ts">
  import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<Disclosure>["open"] = false;
  export let align: ComponentProps<Disclosure>["align"] = "end";
  export let onToggle: (e: CustomEvent<{ open: boolean }>) => void = () => {};
</script>

<Disclosure
  bind:open
  {align}
  on:toggle={onToggle}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
>
  <span slot="summary">Show details</span>
  <p>Hidden content</p>
</Disclosure>
