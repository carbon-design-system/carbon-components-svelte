<script>
  import { ComboBox, createPagedSource } from "carbon-components-svelte";

  const PAGE_SIZE = 25;
  const TOTAL = 120;

  // Simulate a cursor-paged API.
  const invoices = createPagedSource(
    async (query, { signal, cursor }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      signal.throwIfAborted();
      const matches = Array.from({ length: TOTAL }, (_, i) => i + 1).filter(
        (n) => `Invoice #${n}`.includes(query),
      );
      const start = Number(cursor ?? 0);
      const items = matches
        .slice(start, start + PAGE_SIZE)
        .map((n) => ({ id: String(n), text: `Invoice #${n}` }));
      const next = start + PAGE_SIZE;
      return { items, nextCursor: next < matches.length ? String(next) : null };
    },
    { itemKey: (item) => item.id },
  );
</script>

<ComboBox
  labelText="Invoice"
  placeholder="Open and scroll to the bottom"
  source={invoices}
  items={[]}
  loadingText="Loading more…"
/>
