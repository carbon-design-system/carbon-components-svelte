<script>
  import {
    BottomSheet,
    Button,
    Checkbox,
    Search,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListRow,
  } from "carbon-components-svelte";

  export let variant = undefined;
  export let startOpen = undefined;

  const params = new URLSearchParams(location.search);
  // filter: a modal sheet of long content at half and full.
  // map: a non-modal sheet at peek, half and full that cannot close.
  // action: a modal sheet that fits its content.
  variant ??= params.get("variant") ?? "filter";
  const breakpoint = params.has("stay-sheet") ? false : "md";
  const rows = Array.from({ length: 40 }, (_, i) => `Option ${i + 1}`);

  let open = startOpen ?? (variant === "map" || params.has("open"));
  let snapPoint;
  let log = [];
  let pageClicks = 0;

  const snapPoints =
    variant === "map"
      ? ["peek", "half", "full"]
      : variant === "action"
        ? ["content"]
        : ["half", "full"];
</script>

<p>Results</p>
<Button
  data-testid="open"
  on:click={() => {
    open = true;
  }}>Open sheet</Button
>
<Button
  kind="tertiary"
  data-testid="page-button"
  on:click={() => {
    pageClicks += 1;
  }}>Page action</Button
>
<span data-testid="page-clicks">{pageClicks}</span>
<span data-testid="snap">{snapPoint ?? ""}</span>
<span data-testid="log">{log.join(",")}</span>
<input data-testid="outside-input" aria-label="Outside field" />

{#if variant === "filter"}
  <BottomSheet
    bind:open
    bind:snapPoint
    {snapPoints}
    {breakpoint}
    title="Filters"
    on:close={(e) => (log = [...log, `close:${e.detail.trigger}`])}
    on:snap={(e) => (log = [...log, `snap:${e.detail.trigger}`])}
  >
    {#each rows as row}
      <Checkbox labelText={row} />
    {/each}
    <svelte:fragment slot="actions">
      <Button kind="secondary" on:click={() => (open = false)}>Clear</Button>
      <Button on:click={() => (open = false)}>Apply</Button>
    </svelte:fragment>
  </BottomSheet>
{:else}
  <BottomSheet
    bind:open
    bind:snapPoint
    {snapPoints}
    {breakpoint}
    modal={variant !== "map"}
    dismissible={variant !== "map"}
    title={variant === "map" ? "Nearby places" : "Actions"}
    on:close={(e) => (log = [...log, `close:${e.detail.trigger}`])}
    on:snap={(e) => (log = [...log, `snap:${e.detail.trigger}`])}
  >
    {#if variant === "map"}
      <Search labelText="Search places" placeholder="Search places" />
      <StructuredList>
        <StructuredListBody>
          {#each rows as row}
            <StructuredListRow>
              <StructuredListCell>{row}</StructuredListCell>
            </StructuredListRow>
          {/each}
        </StructuredListBody>
      </StructuredList>
    {:else}
      <ul>
        <li><Button kind="ghost" data-testid="share">Share</Button></li>
        <li><Button kind="ghost">Duplicate</Button></li>
        <li><Button kind="danger-ghost">Delete</Button></li>
      </ul>
    {/if}
  </BottomSheet>
{/if}
