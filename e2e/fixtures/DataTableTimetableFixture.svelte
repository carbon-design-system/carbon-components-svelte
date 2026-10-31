<script>
  import { DataTable } from "carbon-components-svelte";

  // Options come from the query string: `rtl`, `zebra`, `size=compact`,
  // `plain` (no `crosshair` or `cellFocus`), `sortable`.
  const params = new URLSearchParams(location.search);
  const has = (name) => params.has(name);

  if (has("rtl")) document.documentElement.setAttribute("dir", "rtl");

  // A grid wider and taller than its box: 24 stations by 30 trains.
  const headers = [
    { key: "station", value: "Station", columnPinned: "start", width: "10rem" },
    ...Array.from({ length: 30 }, (_, i) => ({
      key: `t${i}`,
      value: String(101 + i),
      width: "5rem",
    })),
  ];

  const rows = Array.from({ length: 24 }, (_, j) => ({
    id: j,
    station: `Station ${j + 1}`,
    ...Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [
        `t${i}`,
        i % 4 === 1 && j % 2
          ? "—"
          : `${5 + Math.floor((i * 30 + j * 4) / 60)}:${String((i * 30 + j * 4) % 60).padStart(2, "0")}`,
      ]),
    ),
  }));
</script>

<div data-testid="timetable-root" style="width: 480px;">
  <DataTable
    title="Timetable"
    fixedLayout
    stickyHeader
    stickyHeaderMaxHeight={320}
    sortable={has("sortable")}
    crosshair={!has("plain")}
    cellFocus={!has("plain")}
    zebra={has("zebra")}
    size={params.get("size") ?? undefined}
    {headers}
    {rows}
  />
</div>
