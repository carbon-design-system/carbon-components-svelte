<script lang="ts">
  import { getContext, setContext } from "svelte";

  type Ctx = {
    tableRows: {
      subscribe: (fn: (value: unknown) => void) => () => void;
    };
    [key: string]: unknown;
  };

  // Number of times any live subscriber callback has fired (including the
  // immediate fire every new subscription receives from the store).
  export let count = 0;

  const ctx = getContext<Ctx>("carbon:DataTable");
  const originalSubscribe = ctx.tableRows.subscribe.bind(ctx.tableRows);

  setContext("carbon:DataTable", {
    ...ctx,
    tableRows: {
      ...ctx.tableRows,
      subscribe: (fn: (value: unknown) => void) => {
        return originalSubscribe((value: unknown) => {
          count += 1;
          fn(value);
        });
      },
    },
  });
</script>

<slot />
