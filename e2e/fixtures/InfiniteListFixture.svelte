<script lang="ts">
  import InfiniteList from "carbon-components-svelte/InfiniteList/InfiniteList.svelte";
  import Link from "carbon-components-svelte/Link/Link.svelte";

  // Every knob is a query parameter, so one fixture serves every test:
  // ?mode=auto&scroll=container&pattern=feed&restore&cap=60&latency=300
  // &fail=3&pages=0&pageSize=20&total=4000&autoPages=2
  const params = new URLSearchParams(location.search);
  const number = (name: string, fallback: number) =>
    Number(params.get(name) ?? fallback);

  const pageSize = number("pageSize", 20);
  const total = number("total", 4000);
  const latency = number("latency", 0);
  // Pages (1-based) that fail on their first request.
  const failOnce = new Set(
    (params.get("fail") ?? "").split(",").filter(Boolean).map(Number),
  );
  const failed = new Set<number>();

  type Result = { id: number; title: string; snippet: string };

  function page(offset: number) {
    const end = Math.min(offset + pageSize, total);
    return {
      items: Array.from({ length: end - offset }, (_, i): Result => ({
        id: offset + i + 1,
        title: `Result ${offset + i + 1}`,
        snippet: "A short description of the result, kept to a line or two.",
      })),
      nextCursor: end < total ? end : undefined,
      total,
    };
  }

  async function load({
    cursor,
    signal,
  }: {
    cursor: unknown;
    signal: AbortSignal;
  }) {
    const offset = Number(cursor ?? 0);
    const index = offset / pageSize + 1;
    if (latency) {
      await new Promise((resolve) => setTimeout(resolve, latency));
      signal.throwIfAborted();
    }
    if (failOnce.has(index) && !failed.has(index)) {
      failed.add(index);
      throw new Error(`page ${index} failed`);
    }
    return page(offset);
  }

  const mode = (params.get("mode") ?? "button") as
    "button" | "auto" | "auto-then-button";
  const scroll = params.get("scroll") === "container" ? "container" : "window";
  const feed = params.get("pattern") === "feed";
  const cap = params.has("cap") ? number("cap", 0) : undefined;
  const restore = params.has("restore");
  // A card of about 30 elements, for measuring the cost of depth.
  const heavy = params.get("weight") === "heavy";
  const initial = params.get("pages") === "0" ? undefined : page(0);
</script>

<main>
  <h1>Search results</h1>
  <p>
    <Link href="#top" data-testid="before">Link before the list</Link>
  </p>
  <InfiniteList
    id="results"
    {load}
    {initial}
    {mode}
    {scroll}
    {restore}
    maxItems={cap}
    pattern={feed ? "feed" : "list"}
    lazyItems={params.has("lazy")}
    autoPages={number("autoPages", 2)}
    height="24rem"
    aria-label="Search results"
    let:item
  >
    <div class="result">
      <h2>
        <Link
          href="/index.html?result={item.id}"
          data-testid="result-{item.id}"
        >
          {item.title}
        </Link>
      </h2>
      <p>{item.snippet}</p>
      {#if heavy}
        <div>
          {#each Array(8) as _, tag}
            <span class="tag">Tag {tag}</span>
          {/each}
        </div>
        <ul>
          {#each Array(6) as _, row}
            <li><span>Detail {row}</span></li>
          {/each}
        </ul>
      {/if}
    </div>
  </InfiniteList>
  <footer>
    <Link href="#top" data-testid="footer-link">Footer link</Link>
  </footer>
</main>

<style>
  main {
    max-inline-size: 40rem;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    margin-block-end: 1rem;
  }

  .result {
    padding: 1rem;
    border-block-end: 1px solid var(--cds-border-subtle);
  }

  .result h2 {
    font-size: 1rem;
    margin: 0;
  }

  footer {
    padding-block: 2rem;
  }
</style>
