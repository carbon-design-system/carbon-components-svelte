<script lang="ts">
  import MergeResolver from "carbon-components-svelte/MergeResolver/MergeResolver.svelte";
  import type { ComponentProps } from "svelte";

  export let base: ComponentProps<MergeResolver>["base"] = "";
  export let ours: ComponentProps<MergeResolver>["ours"] = "";
  export let theirs: ComponentProps<MergeResolver>["theirs"] = "";
  export let conflicted: ComponentProps<MergeResolver>["conflicted"] =
    undefined;
  export let layout: ComponentProps<MergeResolver>["layout"] = "columns";
  export let onResolve: (event: CustomEvent) => void = () => {};
  export let onChange: (event: CustomEvent) => void = () => {};

  let result = "";
  let current = -1;
  let resolved = false;
  let resolver: MergeResolver;

  export function api() {
    return resolver;
  }
</script>

<MergeResolver
  bind:this={resolver}
  bind:result
  bind:current
  bind:resolved
  {base}
  {ours}
  {theirs}
  {conflicted}
  {layout}
  on:resolve={onResolve}
  on:change={onChange}
/>
<pre data-testid="result">{result}</pre>
<span data-testid="current">{current}</span>
<span data-testid="resolved">{resolved}</span>
