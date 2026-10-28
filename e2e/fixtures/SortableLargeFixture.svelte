<script>
  import {
    applySort,
    ContainedList,
    ContainedListItem,
    sortable,
    VirtualList,
  } from "carbon-components-svelte";

  const make = (count) =>
    Array.from({ length: count }, (_, i) => ({
      id: `row-${i + 1}`,
      text: `Row ${i + 1}`,
    }));

  let plain = make(1000);
  let windowed = make(1000);
  let log = "";
  let scroller = null;

  function onPlain(event) {
    log = `plain ${event.detail.oldIndex}>${event.detail.newIndex}`;
    plain = applySort(plain, event.detail);
  }

  function onWindowed(event) {
    log = `windowed ${event.detail.oldIndex}>${event.detail.newIndex}`;
    windowed = applySort(windowed, event.detail);
  }
</script>

<p data-testid="log">{log}</p>
<p data-testid="plain-first">
  {plain
    .slice(0, 3)
    .map((row) => row.text)
    .join(",")}
</p>
<p data-testid="windowed-first">
  {windowed
    .slice(0, 3)
    .map((row) => row.text)
    .join(",")}
</p>

<div data-testid="plain-scroller" class="scroller">
  <ul
    aria-label="Plain rows"
    data-testid="plain"
    use:sortable={{ handleSelector: "button" }}
    on:sort={onPlain}
  >
    {#each plain as row (row.id)}
      <li data-sortable-id={row.id} class="row">
        <button type="button"
          ><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"
            ><circle cx="8" cy="8" r="3" /></svg
          ></button
        >
        {row.text}
      </li>
    {/each}
  </ul>
</div>

<div
  data-testid="windowed"
  class="scroller"
  bind:this={scroller}
  use:sortable={{
    itemSelector: ".bx--contained-list-item",
    handleSelector: "button",
  }}
  on:sort={onWindowed}
>
  <ContainedList labelText="Windowed rows">
    <VirtualList
      items={windowed}
      itemHeight={47}
      containerHeight={240}
      scrollElement={scroller}
      spacerTag="li"
      getKey={(row) => row.id}
      let:item
    >
      <ContainedListItem data-sortable-id={item.id}>
        <button type="button"
          ><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"
            ><circle cx="8" cy="8" r="3" /></svg
          ></button
        >
        {item.text}
      </ContainedListItem>
    </VirtualList>
  </ContainedList>
</div>

<style>
  .scroller {
    height: 240px;
    overflow-y: auto;
    margin-bottom: 1rem;
  }
  .row {
    display: flex;
    height: 40px;
    box-sizing: border-box;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid #c6c6c6;
    list-style: none;
  }
  ul {
    padding: 0;
    margin: 0;
  }
</style>
