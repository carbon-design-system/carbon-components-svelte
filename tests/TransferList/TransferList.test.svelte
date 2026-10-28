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
</script>

<form>
  <TransferList
    {items}
    bind:selectedIds
    legendText="Teams"
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
