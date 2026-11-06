<script>
  import {
    announceSourceStatus,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const services = [
    "auth-gateway",
    "auth-sessions",
    "billing-api",
    "billing-worker",
    "catalog-search",
    "catalog-sync",
    "checkout-web",
    "notifications-queue",
  ];

  // A small stand-in for `createAsyncSource`: the newest query wins, and
  // `onStatus` reports when it starts loading, succeeds or fails.
  function createSource(fetcher) {
    let id = 0;
    let controller;
    let timer;
    const listeners = new Set();
    const subscribers = new Set();
    let state = { status: "idle", data: [] };

    function emit(next, reason) {
      const previous = state.status;
      state = { ...state, ...next };
      for (const run of subscribers) run(state);
      if (reason) {
        for (const listener of listeners) {
          listener({
            type: state.status,
            previous,
            count: state.data.length,
            reason,
          });
        }
      }
    }

    async function run(query) {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      const mine = ++id;
      if (state.status !== "loading") emit({ status: "loading" }, "fetch");
      try {
        const data = await fetcher(query, signal);
        if (mine === id) emit({ status: "success", data }, "fetch");
      } catch {
        if (mine === id && !signal.aborted) emit({ status: "error" }, "fetch");
      }
    }

    return {
      subscribe(run) {
        subscribers.add(run);
        run(state);
        return () => subscribers.delete(run);
      },
      onStatus(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      set(query) {
        clearTimeout(timer);
        timer = setTimeout(() => run(query), 150);
      },
    };
  }

  const source = createSource(async (query, signal) => {
    // For demo purposes only: a slow search, slower for longer queries.
    await new Promise((resolve, reject) => {
      const done = setTimeout(resolve, 300 + query.length * 250);
      signal.addEventListener("abort", () => {
        clearTimeout(done);
        reject(new Error("aborted"));
      });
    });
    return services.filter((name) => name.includes(query));
  });

  let query = "";

  // "Loading" is said only when the answer is slow, "N services" once the
  // answers settle, and a failure is said at once.
  onMount(() =>
    announceSourceStatus(source.onStatus, {
      channel: "services",
      loading: () => "Searching services",
      results: (count) => (count === 0 ? "No services" : `${count} services`),
      error: () => "Could not search services",
    }),
  );
</script>

<Stack gap={4}>
  <TextInput
    labelText="Search services"
    bind:value={query}
    on:input={() => source.set(query)}
  />
  <ul>
    {#each $source.data as name}
      <li>{name}</li>
    {/each}
  </ul>
</Stack>
