<script>
  import { VirtualList } from "carbon-components-svelte";

  const items = Array.from({ length: 100_000 }, (_, i) => ({
    id: i,
    text: `Option ${i}`,
  }));

  /** @type {import("svelte").SvelteComponent | undefined} */
  let list;
  let active = 0;

  /** @param {number} next */
  function move(next) {
    active = Math.max(0, Math.min(items.length - 1, next));
    list.scrollToIndex(active, { align: "nearest" });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const moves = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      PageDown: active + 8,
      PageUp: active - 8,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    move(moves[event.key]);
  }
</script>

<!-- The listbox keeps one tab stop and names its active option, so the option
  has to stay mounted wherever the window is. Keys bubble up from it. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onKeydown}>
  <VirtualList
    data-testid="listbox"
    bind:this={list}
    role="listbox"
    tabindex="0"
    aria-label="Options"
    aria-activedescendant="option-{active}"
    {items}
    itemHeight={32}
    containerHeight={256}
    keepMounted={[active]}
    getKey={(item) => item.id}
    let:item
  >
    <div
      id="option-{item.id}"
      role="option"
      aria-selected={item.id === active}
      aria-posinset={item.id + 1}
      aria-setsize={items.length}
      class="option"
      class:active={item.id === active}
      style:height="32px"
    >
      {item.text}
    </div>
  </VirtualList>
</div>

<span data-testid="active">{active}</span>

<style>
  .option {
    box-sizing: border-box;
    padding: 0.5rem;
    border-block-end: 1px solid var(--cds-border-subtle, #c6c6c6);
  }

  .active {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }
</style>
