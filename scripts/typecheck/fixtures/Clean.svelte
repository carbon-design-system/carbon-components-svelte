<script lang="ts">
  import { writable } from "svelte/store";
  import Child from "./Child.svelte";

  const total = writable(0);
  const items = [{ id: 1, label: "One" }];
  let ref: HTMLDivElement | null = null;
  let last = "";
  $: double = $total * 2;
</script>

<Child count={double} on:change={(e) => (last = e.detail.value)} let:item>
  {item.text}
  <span slot="footer" let:total>{total.toFixed(0)}</span>
</Child>
{#each items as item (item.id)}<p>{item.label}</p>{/each}
<div bind:this={ref}>{last}</div>
