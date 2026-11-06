<script lang="ts">
  import {
    AddSelect,
    MultiAddSelect,
    SidePanel,
  } from "carbon-components-svelte";
  import {
    buildCatalog,
    catalogFilters,
    createCatalogSource,
  } from "../../docs/src/add-select-catalog";

  // `?multi=0` for AddSelect, `?data=items` to search in memory, `?latency=`
  // for the simulated server, `?fail=text` to fail queries containing text,
  // `?shell=panel` to host it in a SidePanel, `?select=parents`.
  const params = new URLSearchParams(location.search);
  const multi = params.get("multi") !== "0";
  const data = params.get("data") ?? "source";
  const latency = Number(params.get("latency") ?? 120);
  const shell = params.get("shell") ?? "inline";
  const scope = params.get("scope") === "all" ? "all" : "level";
  const catalog = buildCatalog();
  const source =
    data === "items"
      ? undefined
      : createCatalogSource(catalog, {
          latency,
          failOn: params.get("fail") ?? undefined,
        });
  const items = data === "items" ? catalog : undefined;

  let open = true;
  let value: (string | number)[] | string | number | null = multi ? [] : null;
  let events: string[] = [];
  let confirmed = "";
  const log = (name: string) => () => {
    events = [...events, name];
  };
  const props = {
    items,
    source,
    filters: catalogFilters,
    labelText: "Datasets",
    rootText: "Catalog",
    searchScope: scope as "level" | "all",
    selectParents: params.get("select") === "parents",
    debounce: 150,
  };
  function done(event: CustomEvent) {
    confirmed = JSON.stringify(event.detail.value);
    events = [...events, "confirm"];
  }
</script>

{#if shell === "panel"}
  <SidePanel bind:open size="2xl" includeOverlay title="Attach datasets">
    {#if multi}
      <MultiAddSelect
        bind:value
        {...props}
        on:confirm={done}
        on:cancel={log("cancel")}
      />
    {:else}
      <AddSelect
        bind:value
        {...props}
        on:confirm={done}
        on:cancel={log("cancel")}
      />
    {/if}
  </SidePanel>
{:else if multi}
  <MultiAddSelect
    bind:value
    {...props}
    on:confirm={done}
    on:cancel={log("cancel")}
    on:change={log("change")}
  />
{:else}
  <AddSelect
    bind:value
    {...props}
    on:confirm={done}
    on:cancel={log("cancel")}
    on:change={log("change")}
  />
{/if}

<output data-testid="value">{JSON.stringify(value)}</output>
<output data-testid="confirmed">{confirmed}</output>
<output data-testid="events">{events.join(",")}</output>
