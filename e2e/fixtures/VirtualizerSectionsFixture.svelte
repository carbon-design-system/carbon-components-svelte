<script>
  import { VirtualList } from "carbon-components-svelte";

  const SECTIONS = 200;
  const PER_SECTION = 500;

  /** Each section is a header followed by its rows. */
  const items = [];
  /** @type {number[]} */
  const headers = [];
  for (let section = 0; section < SECTIONS; section++) {
    headers.push(items.length);
    items.push({ id: `s${section}`, header: true, text: `Section ${section}` });
    for (let row = 0; row < PER_SECTION; row++) {
      items.push({
        id: `s${section}r${row}`,
        header: false,
        text: `Section ${section}, row ${row}`,
      });
    }
  }
</script>

<VirtualList
  data-testid="sections"
  {items}
  stickyIndices={headers}
  itemHeight={32}
  containerHeight={256}
  getKey={(item) => item.id}
  let:item
>
  <div class="row" class:header={item.header} style:height="32px">
    {item.text}
  </div>
</VirtualList>

<style>
  .row {
    box-sizing: border-box;
    padding: 0.5rem;
    overflow: hidden;
    white-space: nowrap;
    border-block-end: 1px solid var(--cds-border-subtle, #c6c6c6);
  }

  .header {
    font-weight: 600;
    /* A pinned item is transparent: it needs a fill to cover what scrolls under it. */
    background: var(--cds-layer-accent, #e0e0e0);
  }
</style>
