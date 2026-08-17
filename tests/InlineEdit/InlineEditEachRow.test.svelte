<script lang="ts">
  import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";

  let rows = [
    { id: "a", item: "Widget" },
    { id: "b", item: "Gadget" },
  ];
</script>

<button
  type="button"
  on:click={() => {
    rows = rows.map((row) =>
      row.id === "a" ? { ...row, item: "Sprocket" } : row,
    );
  }}
>
  Rename outside
</button>

{#each rows as row (row.id)}
  <InlineEdit
    id="item-{row.id}"
    labelText="Item {row.id}"
    editLabel="Edit {row.id}"
    saveLabel="Save {row.id}"
    cancelLabel="Cancel {row.id}"
    bind:value={row.item}
    on:save={() => console.log("save", row.id, row.item)}
    on:cancel={() => console.log("cancel", row.id, row.item)}
  />
{/each}
