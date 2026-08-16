import { cleanup, render } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { bench, run } from "mitata";

// DataTable's equivalent of treeview-mount.dom.bench.ts: dataTableSort.bench.ts
// and virtualize.bench.ts already proved the sort/windowing math in isolation
// — this checks whether the real component's mount cost actually benefits
// from virtualization the same way TreeView's did.
//
// No `.gc("inner")` here — see treeview-mount.dom.bench.ts's comment. Forcing
// a real GC after every iteration over a large jsdom DOM object graph
// (rather than plain JS objects/arrays) induced real thermal throttling
// there; default batching (as dropdown.dom.bench.ts already uses) is safe.

const headers = [
  { key: "name", value: "Name" },
  { key: "protocol", value: "Protocol" },
  { key: "port", value: "Port" },
  { key: "rule", value: "Rule" },
];

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i,
    rule: "Round robin",
  }));
}

it("benchmarks mounting a large DataTable, virtualized vs not", async () => {
  // Every row becomes a real jsdom DOM row — capped well below the
  // virtualized range below, same reasoning as TreeView's non-virtualized case.
  bench("mount DataTable, $size rows, no virtualization", function* (state) {
    const size = state.get("size");
    const rows = buildRows(size);
    yield () => {
      render(DataTable, { props: { headers, rows } });
      cleanup();
    };
  }).range("size", 20, 300);

  // Virtualized: only the visible window (~10 rows at default maxVisibleRows)
  // mounts regardless of row count. DataTable's virtualization threshold is
  // 100 rows by default, so sizes below that render everything unvirtualized
  // even with virtualize enabled — range starts at 100 to stay above it.
  bench("mount DataTable, $size rows, virtualized", function* (state) {
    const size = state.get("size");
    const rows = buildRows(size);
    yield () => {
      render(DataTable, {
        props: { headers, rows, virtualize: true, stickyHeader: true },
      });
      cleanup();
    };
  }).range("size", 100, 3000);

  // Cell records used to be built for every `rows` entry, even when
  // virtualize/pagination only painted a window. Wide tables make that
  // rows×columns allocation visible at mount.
  const wideHeaders = Array.from({ length: 20 }, (_, i) => ({
    key: `col${i}`,
    value: `Col ${i}`,
  }));
  const wideRows3000 = Array.from({ length: 3000 }, (_, i) => {
    const row: Record<string, string> = { id: String(i) };
    for (let c = 0; c < 20; c++) row[`col${c}`] = `${i}-${c}`;
    return row;
  });

  bench("mount DataTable, 3000 rows × 20 cols, virtualized", () => {
    render(DataTable, {
      props: {
        headers: wideHeaders,
        rows: wideRows3000,
        virtualize: true,
        stickyHeader: true,
      },
    });
    cleanup();
  });

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 180_000);
