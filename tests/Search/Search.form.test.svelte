<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<Search>["value"] = "";
  export let expandable: ComponentProps<Search>["expandable"] = false;
  export let expanded: ComponentProps<Search>["expanded"] = false;
  export let onExpand: (event: CustomEvent) => void = () => {};
  export let onCollapse: (event: CustomEvent) => void = () => {};
  export let onInput: (event: Event) => void = () => {};
  export let onChange: (event: Event) => void = () => {};
  export let onClear: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <Search
    bind:value
    bind:expanded
    {expandable}
    name="q"
    labelText="Search"
    on:expand={onExpand}
    on:collapse={onCollapse}
    on:input={onInput}
    on:change={onChange}
    on:clear={onClear}
  />
</form>
<p data-testid="bound-value">{String(value)}</p>
<p data-testid="bound-expanded">{String(expanded)}</p>
