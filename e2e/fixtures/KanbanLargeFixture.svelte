<script>
  import { Kanban } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const columnCount = Number(params.get("columns") ?? 8);
  const perColumn = Number(params.get("cards") ?? 300);

  const columns = Array.from({ length: columnCount }, (_, index) => ({
    id: `c${index}`,
    title: `Column ${index + 1}`,
  }));
  const names = [
    "Ada Lovelace",
    "Grace Hopper",
    "Alan Turing",
    "Edsger Dijkstra",
  ];
  const types = ["blue", "purple", "teal", "magenta"];

  let items = columns.flatMap((column, columnIndex) =>
    Array.from({ length: perColumn }, (_, index) => ({
      id: `${column.id}-${index}`,
      column: column.id,
      title: `Card ${columnIndex + 1}.${index + 1}: a task with a title`,
      description:
        index % 3 === 0 ? "A short description of the work." : undefined,
      tags: [{ text: `T${index % 7}`, type: types[index % 4] }],
      assignee: names[index % 4],
    })),
  );
  let moves = 0;
</script>

<div style="padding: 1rem;">
  <div style="block-size: 640px;">
    <Kanban
      data-testid="board"
      aria-label="Large board"
      {columns}
      bind:items
      on:move={() => moves++}
    />
  </div>
  <p data-testid="moves">{moves}</p>
</div>
