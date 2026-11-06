<script>
  import { ComboBox, createAsyncSource } from "carbon-components-svelte";

  // `?latency=300` is the round trip in ms. `?fail=1` makes the source fail
  // until `window.healed = true`.
  const params = new URLSearchParams(location.search);
  const latency = Number(params.get("latency") ?? 300);
  const failing = params.get("fail") === "1";

  const people = ["Alice", "Alan", "Amir", "Anna", "Bea", "Bob", "Chen"];

  /** @param {number} ms @param {AbortSignal} signal */
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  /** Every request is logged, to count them from a test. */
  const page = /** @type {Window & { requests: string[], healed: boolean }} */ (
    window
  );
  page.requests = [];
  page.healed = false;

  const source = createAsyncSource(
    async (query, { signal }) => {
      page.requests.push(query);
      // A real request, so a browser that is offline fails it.
      await fetch(location.pathname, { method: "HEAD", signal });
      await sleep(latency, signal);
      if (failing && !page.healed) throw new Error("503");
      return people.map((name) => ({ id: name, text: `${name} (${query})` }));
    },
    { debounce: Number(params.get("debounce") ?? 0) },
  );
</script>

<ComboBox
  data-testid="combobox-source"
  labelText="Person"
  placeholder="Search people"
  {source}
  items={[]}
  loadingDelay={Number(params.get("loadingDelay") ?? 0)}
/>
