<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import { type ComponentProps, onMount } from "svelte";

  export let onopen: (detail: unknown) => void = () => {};

  let targetA: HTMLElement | null = null;
  let targetB: HTMLElement | null = null;
  let target: ReadonlyArray<HTMLElement | null> | null = null;

  onMount(() => {
    target = [targetA];
  });

  function swap() {
    target = [targetB];
  }

  // `target` takes one element as well as a list.
  const _single: ComponentProps<ContextMenu>["target"] = document.body;
  void _single;
</script>

<div data-testid="target-a" bind:this={targetA}>A</div>
<div data-testid="target-b" bind:this={targetB}>B</div>
<button type="button" data-testid="swap" on:click={swap}>swap</button>

<ContextMenu {target} on:open={(e) => onopen(e.detail)}>
  <ContextMenuOption labelText="Option 1" />
  <ContextMenuOption labelText="Option 2" />
</ContextMenu>
