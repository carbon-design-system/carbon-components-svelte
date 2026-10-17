<script lang="ts">
  import { getContext, setContext } from "svelte";

  type Ctx = {
    filterRows: (
      value: string | number,
      shouldFilterRows?: unknown,
    ) => readonly (string | number)[];
    [key: string]: unknown;
  };

  export let count = 0;
  export let onFilter: (() => void) | undefined = undefined;

  const ctx = getContext<Ctx>("carbon:DataTable");
  const original = ctx.filterRows;

  setContext("carbon:DataTable", {
    ...ctx,
    filterRows: (value: string | number, shouldFilterRows?: unknown) => {
      count += 1;
      onFilter?.();
      return original(value, shouldFilterRows);
    },
  });
</script>

<slot />
