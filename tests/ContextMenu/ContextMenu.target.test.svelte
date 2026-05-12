<script lang="ts">
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let targetA: HTMLElement | null = null;
  let targetB: HTMLElement | null = null;
  let target: ReadonlyArray<HTMLElement | null> | null = null;

  onMount(() => {
    target = [targetA];
  });

  function swap() {
    target = [targetB];
  }
</script>

<div data-testid="target-a" bind:this={targetA}>A</div>
<div data-testid="target-b" bind:this={targetB}>B</div>
<button type="button" data-testid="swap" on:click={swap}>swap</button>

<ContextMenu
  {target}
  on:open={(e) => {
    console.log("open", e.detail);
  }}
>
  <ContextMenuOption labelText="Option 1" />
  <ContextMenuOption labelText="Option 2" />
</ContextMenu>
