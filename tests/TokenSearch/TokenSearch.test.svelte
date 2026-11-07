<script lang="ts">
  import TokenSearch from "carbon-components-svelte/TokenSearch/TokenSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let keys: ComponentProps<TokenSearch>["keys"] = [
    { key: "is", label: "State", type: "enum", values: ["open", "closed"] },
    { key: "label", type: "enum", values: ["bug", "ui", "good first issue"] },
    { key: "author", type: "user", values: ["alice", "bob"] },
    { key: "created", type: "date" },
  ];
  export let value = "";
  export let query: ComponentProps<TokenSearch>["query"] | undefined =
    undefined;
  export let open = false;
  export let recentQueries: string[] = [];
  export let highlight = true;
  export let onChange: (detail: unknown) => void = () => {};
  export let onSearch: (detail: unknown) => void = () => {};
  export let onSelect: (detail: unknown) => void = () => {};
</script>

<p id="before">before</p>
<TokenSearch
  {keys}
  {highlight}
  {recentQueries}
  bind:value
  bind:query
  bind:open
  labelText="Query"
  debounce={0}
  now={new Date(2026, 10, 3)}
  on:change={(event) => onChange(event.detail)}
  on:search={(event) => onSearch(event.detail)}
  on:select={(event) => onSelect(event.detail)}
/>
<p id="after">after</p>
<p data-testid="query">{JSON.stringify(query)}</p>
