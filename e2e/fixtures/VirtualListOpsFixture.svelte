<script>
  import { Button, VirtualList } from "carbon-components-svelte";

  /** @param {number} from @param {number} to */
  const make = (from, to) =>
    Array.from({ length: to - from }, (_, i) => ({
      id: from + i,
      text: `Row ${from + i}`,
    }));

  /** A deterministic height in 24, 48 or 72px, so measured offsets differ from the estimate. */
  const heightOf = (/** @type {number} */ id) => 24 * (1 + ((id * 7) % 3));

  // Scroll to an index.
  const jumpItems = make(0, 100_000);
  /** @type {import("svelte").SvelteComponent | undefined} */
  let jumpList;
  let jumpAlign = "start";
  let jumpIndex = 5000;

  // Older rows load above.
  let nextOlder = 1000;
  let feedItems = make(nextOlder, 3000);
  let measuredNextOlder = 1000;
  let measuredItems = make(measuredNextOlder, 3000);

  function loadOlder() {
    nextOlder -= 50;
    feedItems = [...make(nextOlder, nextOlder + 50), ...feedItems];
  }

  function loadOlderMeasured() {
    measuredNextOlder -= 50;
    measuredItems = [
      ...make(measuredNextOlder, measuredNextOlder + 50),
      ...measuredItems,
    ];
  }

  // More rows than a browser lays out: 1,000,000 at 24px is 24 million pixels.
  /** @type {ReturnType<typeof make>} */
  let hugeItems = [];
  /** @type {import("svelte").SvelteComponent | undefined} */
  let hugeList;

  // A log that follows its end.
  let logItems = make(0, 100);
  let atEnd = true;
  /** @type {import("svelte").SvelteComponent | undefined} */
  let logList;
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let stream;

  function startStream() {
    stopStream();
    stream = setInterval(() => {
      logItems = [
        ...logItems,
        { id: logItems.length, text: `Row ${logItems.length}` },
      ];
    }, 20);
  }

  function trimLog() {
    logItems = logItems.slice(100);
  }

  function stopStream() {
    clearInterval(stream);
    stream = undefined;
  }
</script>

<div class="ops">
  <section>
    <h2>Scroll to an index</h2>
    <label>
      Index
      <input data-testid="jump-index" type="number" bind:value={jumpIndex} />
    </label>
    <label>
      Align
      <select data-testid="jump-align" bind:value={jumpAlign}>
        <option value="start">start</option>
        <option value="center">center</option>
        <option value="end">end</option>
        <option value="nearest">nearest</option>
      </select>
    </label>
    <Button
      data-testid="jump"
      size="small"
      on:click={() => jumpList.scrollToIndex(jumpIndex, { align: jumpAlign })}
    >
      Scroll
    </Button>
    <VirtualList
      data-testid="jump-list"
      bind:this={jumpList}
      items={jumpItems}
      itemHeight={24}
      containerHeight={240}
      getKey={(item) => item.id}
      let:item
    >
      <div class="row" style:height="24px">{item.text}</div>
    </VirtualList>
  </section>

  <section>
    <h2>Older rows load above</h2>
    <Button data-testid="older" size="small" on:click={loadOlder}>
      Load 50 older
    </Button>
    <VirtualList
      data-testid="feed-list"
      items={feedItems}
      itemHeight={24}
      containerHeight={240}
      getKey={(item) => item.id}
      let:item
    >
      <div class="row" style:height="24px">{item.text}</div>
    </VirtualList>
  </section>

  <section>
    <h2>Older rows load above, measured</h2>
    <Button
      data-testid="older-measured"
      size="small"
      on:click={loadOlderMeasured}
    >
      Load 50 older
    </Button>
    <VirtualList
      data-testid="measured-feed-list"
      measured
      items={measuredItems}
      itemHeight={48}
      containerHeight={240}
      getKey={(item) => item.id}
      let:item
    >
      <div class="row" style:height="{heightOf(item.id)}px">{item.text}</div>
    </VirtualList>
  </section>

  <section>
    <h2>A list taller than a browser scrolls</h2>
    <Button
      data-testid="load-huge"
      size="small"
      on:click={() => (hugeItems = make(0, 1_000_000))}
    >
      Load 1,000,000 rows
    </Button>
    <Button
      data-testid="huge-to-end"
      size="small"
      kind="tertiary"
      on:click={() => hugeList.scrollToEnd()}
    >
      Scroll to end
    </Button>
    {#if hugeItems.length > 0}
      <VirtualList
        data-testid="huge-list"
        bind:this={hugeList}
        items={hugeItems}
        itemHeight={24}
        containerHeight={240}
        getKey={(item) => item.id}
        let:item
      >
        <div class="row" style:height="24px">{item.text}</div>
      </VirtualList>
    {/if}
  </section>

  <section>
    <h2>Follow the end</h2>
    <Button data-testid="stream" size="small" on:click={startStream}>
      Stream 50 a second
    </Button>
    <Button
      data-testid="stop-stream"
      size="small"
      kind="secondary"
      on:click={stopStream}
    >
      Stop
    </Button>
    <Button data-testid="trim" size="small" kind="secondary" on:click={trimLog}>
      Drop 100 oldest
    </Button>
    <Button
      data-testid="jump-to-end"
      size="small"
      kind="tertiary"
      disabled={atEnd}
      on:click={() => logList.scrollToEnd()}
    >
      Jump to latest
    </Button>
    <span data-testid="at-end">{atEnd ? "at end" : "behind"}</span>
    <VirtualList
      data-testid="log-list"
      bind:this={logList}
      bind:atEnd
      follow="end"
      items={logItems}
      itemHeight={24}
      containerHeight={240}
      getKey={(item) => item.id}
      let:item
    >
      <div class="row" style:height="24px">{item.text}</div>
    </VirtualList>
  </section>
</div>

<style>
  .ops {
    display: grid;
    gap: 1rem;
    max-inline-size: 28rem;
  }

  .row {
    box-sizing: border-box;
    overflow: hidden;
    padding-inline: 0.5rem;
    border-block-end: 1px solid var(--cds-border-subtle, #c6c6c6);
  }

  label {
    display: inline-block;
    margin-inline-end: 0.5rem;
  }
</style>
