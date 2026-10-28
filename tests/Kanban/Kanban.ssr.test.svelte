<script lang="ts">
  import Kanban from "carbon-components-svelte/Kanban/Kanban.svelte";

  export let id = "board";
  export let collapsedColumns: string[] = [];

  const columns = [
    { id: "todo", title: "To do" },
    { id: "done", title: "Done" },
  ];
  const items = [
    { id: "a", column: "todo", title: "Alpha" },
    { id: "b", column: "todo", title: "Bravo" },
    { id: "c", column: "done", title: "Charlie" },
  ];
</script>

<Kanban aria-label="Board" {id} {columns} {items} {collapsedColumns} />
