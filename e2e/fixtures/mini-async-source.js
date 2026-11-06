// A minimal copy of createAsyncSource from #5470, kept to what the announcer
// demo needs: the newest answer wins, a newer query aborts the older one, and
// `onStatus` reports the edges. The real helper adds a cache, retry, paging
// and more.

/**
 * @template T
 * @param {(query: string, context: { signal: AbortSignal }) => T[] | Promise<T[]>} fetcher
 * @param {{ debounce?: number }} [options]
 */
export function createMiniSource(fetcher, { debounce = 0 } = {}) {
  /** @type {{ status: "idle" | "loading" | "success" | "error", data: T[], error?: unknown, query: string }} */
  let state = { status: "idle", data: [], query: "" };
  let id = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const subscribers = new Set();
  const statusListeners = new Set();

  /** @param {Partial<typeof state>} next @param {{ reason: string }} [edge] */
  function update(next, edge) {
    const previous = state.status;
    state = { ...state, ...next };
    for (const subscriber of subscribers) subscriber(state);
    if (edge && (previous !== state.status || next.data)) {
      for (const listener of statusListeners) {
        listener({
          type: state.status,
          previous,
          state,
          count: state.data.length,
          reason: edge.reason,
        });
      }
    }
  }

  async function run(query) {
    controller?.abort();
    const mine = ++id;
    controller = new AbortController();
    const { signal } = controller;
    if (state.status === "loading") {
      state = { ...state, query };
    } else {
      update({ status: "loading", query }, { reason: "fetch" });
    }
    try {
      const data = await fetcher(query, { signal });
      if (mine !== id) return;
      update(
        { status: "success", data, error: undefined },
        { reason: "fetch" },
      );
    } catch (error) {
      if (mine !== id || signal.aborted) return;
      update({ status: "error", error }, { reason: "fetch" });
    }
  }

  return {
    subscribe(run) {
      subscribers.add(run);
      run(state);
      return () => subscribers.delete(run);
    },
    onStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    set(query) {
      clearTimeout(timer);
      if (debounce > 0) {
        timer = setTimeout(() => run(query), debounce);
        return;
      }
      run(query);
    },
    cancel() {
      clearTimeout(timer);
      controller?.abort();
      id++;
      update({ status: "idle", data: [] }, { reason: "cancel" });
    },
  };
}
