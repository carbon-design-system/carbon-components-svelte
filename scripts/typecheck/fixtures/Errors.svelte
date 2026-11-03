<script lang="ts">
  import { writable } from "svelte/store";
  import Child from "./Child.svelte";

  const total = writable(0);
  const items = [{ id: 1 }];
  let ref: HTMLDivElement | null = null;
  const typed: number = "one";
</script>

<Child kind="tertiary" count={1} />
<Child count={1} on:change={(e) => e.detail.nope} />
<Child count={1} let:item>{item.nope}</Child>
<Child count={1}><span slot="footer" let:total>{total.nope}</span></Child>
<button type="nope">x</button>
<button on:click={(e) => e.nope}>x</button>
<p>{missing}</p>
{#each items as item}<p>{item.nope}</p>{/each}
<span bind:this={ref}>x</span>
<p>{$total.nope}</p>
<p>{typed}</p>
