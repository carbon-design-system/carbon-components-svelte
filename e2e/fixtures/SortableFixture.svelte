<script>
  import { applySort, sortable } from "carbon-components-svelte";

  let items = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"].map((text) => ({
    id: text.toLowerCase(),
    text,
  }));
  let columns = {
    todo: [
      { id: "t1", text: "Write spec" },
      { id: "t2", text: "Review PR" },
      { id: "t3", text: "Ship it" },
    ],
    done: [{ id: "d1", text: "Plan" }],
    empty: [],
  };
  let tiles = ["One", "Two", "Three", "Four"].map((text) => ({
    id: text.toLowerCase(),
    text,
  }));
  let log = "";
  let veto = false;
  let linkClicks = 0;

  function onSort(event) {
    const { id, from, to, oldIndex, newIndex, source } = event.detail;
    log = `${id}:${from || "-"}>${to || "-"}:${oldIndex}>${newIndex}:${source}`;
    if (veto) {
      event.preventDefault();
      return;
    }
    items = applySort(items, event.detail);
  }

  function onColumnSort(event) {
    const { id, from, to, oldIndex, newIndex } = event.detail;
    log = `${id}:${from}>${to}:${oldIndex}>${newIndex}`;
    columns = applySort(columns, event.detail);
  }

  function onTileSort(event) {
    tiles = applySort(tiles, event.detail);
  }
</script>

<label>
  <input type="checkbox" data-testid="veto" bind:checked={veto} />
  Veto sorts
</label>
<p data-testid="log">{log}</p>
<p data-testid="order">{items.map((item) => item.text).join(",")}</p>
<p data-testid="links">{linkClicks}</p>

<ul
  data-testid="list"
  aria-label="Letters"
  use:sortable={{ handleSelector: "button" }}
  on:sort={onSort}
>
  {#each items as item (item.id)}
    <li data-sortable-id={item.id} class="row">
      <button type="button"
        ><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"
          ><circle cx="8" cy="8" r="3" /></svg
        ></button
      >
      <a
        href="#{item.id}"
        data-testid="link-{item.id}"
        on:click={() => linkClicks++}>{item.text}</a
      >
    </li>
  {/each}
</ul>

<ul
  data-testid="items-list"
  aria-label="Whole item"
  use:sortable={{ name: "whole" }}
  on:sort={(event) => (items = applySort(items, event.detail))}
>
  {#each items as item (item.id)}
    <li data-sortable-id={item.id} class="row">
      <a
        href="#whole-{item.id}"
        data-testid="whole-link-{item.id}"
        on:click={() => linkClicks++}>{item.text}</a
      >
    </li>
  {/each}
</ul>

<ul
  data-testid="tiles"
  aria-label="Tiles"
  class="tiles"
  use:sortable={{ orientation: "horizontal", handleSelector: "button" }}
  on:sort={onTileSort}
>
  {#each tiles as tile (tile.id)}
    <li data-sortable-id={tile.id} class="tile">
      <button type="button" aria-label="Move {tile.text}">&#x2807;</button>
      {tile.text}
    </li>
  {/each}
</ul>

<div class="board" on:sort={onColumnSort}>
  {#each Object.keys(columns) as name (name)}
    <ul
      data-testid="column-{name}"
      aria-label={name}
      class="column"
      use:sortable={{ name, group: "board", handleSelector: "button" }}
    >
      {#each columns[name] as card (card.id)}
        <li data-sortable-id={card.id} class="row">
          <button type="button"
            ><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"
              ><circle cx="8" cy="8" r="3" /></svg
            ></button
          >
          {card.text}
        </li>
      {/each}
    </ul>
  {/each}
</div>

<style>
  .row {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #8d8d8d;
    margin: 0;
    list-style: none;
  }
  .tiles {
    display: flex;
    gap: 0.5rem;
    padding: 0;
  }
  .tile {
    padding: 1rem;
    border: 1px solid #8d8d8d;
    list-style: none;
  }
  .board {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  .column {
    min-width: 12rem;
    min-height: 3rem;
    padding: 0.5rem;
    border: 1px dashed #8d8d8d;
  }
</style>
