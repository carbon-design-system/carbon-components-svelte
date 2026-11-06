<svelte:options accessors />

<script lang="ts">
  import AddSelect from "carbon-components-svelte/AddSelect/AddSelect.svelte";
  import type {
    AddSelectFilter,
    AddSelectItem,
    AddSelectPage,
    AddSelectRequest,
  } from "carbon-components-svelte/AddSelect/AddSelect.svelte";
  import MultiAddSelect from "carbon-components-svelte/AddSelect/MultiAddSelect.svelte";

  export let multi = true;
  export let items: AddSelectItem[] | undefined = undefined;
  export let source:
    | ((
        request: AddSelectRequest,
        context: { signal: AbortSignal; cursor?: number | null },
      ) => AddSelectPage | Promise<AddSelectPage>)
    | undefined = undefined;
  export let value: (string | number)[] = [];
  export let single: string | number | null = null;
  export let path: { id: string | number; title: string }[] = [];
  export let query = "";
  export let filters: AddSelectFilter[] = [];
  export let filterValue: Record<string, string[]> = {};
  export let selectParents = false;
  export let searchScope: "level" | "all" = "level";
  export let commit: "confirm" | "change" = "confirm";
  export let pageSize = 40;
  export let events: string[] = [];

  const log = (name: string) => () => {
    events = [...events, name];
  };
</script>

{#if multi}
  <MultiAddSelect
    bind:value
    bind:path
    bind:query
    bind:filterValue
    {items}
    {source}
    {filters}
    {selectParents}
    {searchScope}
    {commit}
    {pageSize}
    debounce={0}
    labelText="Datasets"
    on:confirm={log("confirm")}
    on:cancel={log("cancel")}
    on:change={log("change")}
    on:navigate={log("navigate")}
  >
    <svelte:fragment slot="details" let:item>
      <p data-testid="details">Details of {item.title}</p>
    </svelte:fragment>
  </MultiAddSelect>
{:else}
  <AddSelect
    bind:value={single}
    bind:path
    bind:query
    bind:filterValue
    {items}
    {source}
    {filters}
    {selectParents}
    {searchScope}
    {commit}
    {pageSize}
    debounce={0}
    labelText="Datasets"
    on:confirm={log("confirm")}
    on:cancel={log("cancel")}
  />
{/if}

<output data-testid="value">{JSON.stringify(multi ? value : single)}</output>
<output data-testid="path">{path.map((crumb) => crumb.title).join("/")}</output>
<output data-testid="events">{events.join(",")}</output>
