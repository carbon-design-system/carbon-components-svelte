<script>
  import { Kanban } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const limitMode = params.get("limitMode") === "block" ? "block" : "warn";
  const collapsible = params.has("collapsible");

  const columns = [
    { id: "todo", title: "To do", limit: 4 },
    { id: "doing", title: "In progress", limit: 2 },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
  ];

  let items = [
    {
      id: "a",
      column: "todo",
      title: "Design the login page",
      tags: [{ text: "Design", type: "purple" }],
      assignee: "Ada Lovelace",
    },
    {
      id: "b",
      column: "todo",
      title: "Write the API spec",
      description: "Cover pagination and errors.",
    },
    { id: "c", column: "todo", title: "Set up CI" },
    {
      id: "d",
      column: "doing",
      title: "Build the board",
      tags: [{ text: "Frontend", type: "blue" }],
      assignee: "Grace Hopper",
    },
    { id: "e", column: "review", title: "Fix the focus ring" },
    { id: "f", column: "done", title: "Ship the changelog" },
    ...(params.has("long")
      ? [
          {
            id: "g",
            column: "review",
            title: "Rotate the keys",
            tags: [{ text: "A tag name long enough to truncate in a card" }],
          },
        ]
      : []),
  ];
  let collapsedIds = [];
  let moves = [];
  let cancel = false;

  function handleMove(event) {
    moves = [...moves, event.detail];
    if (cancel) event.preventDefault();
  }

  $: order = columns.map(
    (column) =>
      `${column.id}:${items
        .filter((item) => item.column === column.id)
        .map((item) => item.id)
        .join(",")}`,
  );
</script>

<div style="padding: 1rem;">
  <label>
    <input type="checkbox" data-testid="cancel" bind:checked={cancel} />
    Refuse moves
  </label>
  <div style="block-size: 460px; margin-block: 1rem;">
    <Kanban
      data-testid="board"
      aria-label="Sprint board"
      {columns}
      bind:items
      bind:collapsedIds
      {collapsible}
      {limitMode}
      on:move={handleMove}
    />
  </div>
  <pre data-testid="order">{order.join(" | ")}</pre>
  <pre data-testid="moves">{JSON.stringify(moves)}</pre>
</div>
