<script lang="ts">
  import TransferList from "carbon-components-svelte/TransferList/TransferList.svelte";

  export let selectedIds: Array<string | number> = ["b"];
  export let items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Bravo" },
    { id: "c", text: "Charlie" },
    { id: "d", text: "Delta", disabled: true },
    { id: "e", text: "Echo" },
  ];
  export let changes: string[] = [];
  export let moves: string[] = [];
  export let cancelMoves = false;
</script>

<form>
  <TransferList
    {items}
    bind:selectedIds
    legendText="Teams"
    on:move={(event) => {
      const { ids, from, to, selectedIds: next } = event.detail;
      moves = [...moves, `${from}>${to}:${ids.join(",")}=${next.join(",")}`];
      if (cancelMoves) event.preventDefault();
    }}
    on:change={(event) => {
      changes = [
        ...changes,
        `${event.detail.direction}:${event.detail.movedIds.join(",")}`,
      ];
    }}
    {...$$restProps}
  />
  <button type="reset">Reset form</button>
  <button type="submit">Submit form</button>
</form>
<p data-testid="selected">{selectedIds.join(",")}</p>
<p data-testid="changes">{changes.join("|")}</p>
<p data-testid="moves">{moves.join("|")}</p>
