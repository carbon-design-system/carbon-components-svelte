<script lang="ts">
  import { getContext, setContext } from "svelte";

  type Ctx = {
    filterRows: (
      value: string | number,
      shouldFilterRows?: unknown,
    ) => readonly (string | number)[];
    tableRows: {
      subscribe: (fn: (value: unknown) => void) => () => void;
    };
    [key: string]: unknown;
  };

  /** Called on every `filterRows` call. */
  export let onfilterrows: (() => void) | undefined = undefined;
  /**
   * Called each time any live `tableRows` subscriber fires (including the
   * immediate fire every new subscription receives from the store).
   */
  export let ontablerows: (() => void) | undefined = undefined;

  // Wrap only the members a test spies on, so tests that pass no callback
  // run against the untouched DataTable context.
  const ctx = getContext<Ctx>("carbon:DataTable");
  const spied: Ctx = { ...ctx };

  if (onfilterrows) {
    const original = ctx.filterRows;
    spied.filterRows = (value, shouldFilterRows) => {
      onfilterrows?.();
      return original(value, shouldFilterRows);
    };
  }

  if (ontablerows) {
    const originalSubscribe = ctx.tableRows.subscribe.bind(ctx.tableRows);
    spied.tableRows = {
      ...ctx.tableRows,
      subscribe: (fn) =>
        originalSubscribe((value) => {
          ontablerows?.();
          fn(value);
        }),
    };
  }

  setContext("carbon:DataTable", spied);
</script>

<slot />
