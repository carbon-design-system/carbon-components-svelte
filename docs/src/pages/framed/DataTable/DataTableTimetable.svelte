<script>
  import {
    Box,
    ContentSwitcher,
    DataTable,
    Stack,
    Switch,
    Tag,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  // Minutes are from San Francisco on a local train. Tier 0 stations
  // are served by every train, tier 1 by limited and local trains, tier 2 by
  // local trains only.
  const stations = [
    { name: "San Francisco", minutes: 0, tier: 0 },
    { name: "22nd Street", minutes: 5, tier: 2 },
    { name: "Bayshore", minutes: 9, tier: 2 },
    { name: "South San Francisco", minutes: 13, tier: 1 },
    { name: "San Bruno", minutes: 16, tier: 2 },
    { name: "Millbrae", minutes: 20, tier: 0 },
    { name: "Broadway", minutes: 22, tier: 2 },
    { name: "Burlingame", minutes: 24, tier: 2 },
    { name: "San Mateo", minutes: 28, tier: 1 },
    { name: "Hayward Park", minutes: 31, tier: 2 },
    { name: "Hillsdale", minutes: 34, tier: 1 },
    { name: "Belmont", minutes: 37, tier: 2 },
    { name: "San Carlos", minutes: 40, tier: 1 },
    { name: "Redwood City", minutes: 44, tier: 0 },
    { name: "Menlo Park", minutes: 49, tier: 2 },
    { name: "Palo Alto", minutes: 53, tier: 0 },
    { name: "California Ave", minutes: 57, tier: 2 },
    { name: "San Antonio", minutes: 60, tier: 2 },
    { name: "Mountain View", minutes: 64, tier: 0 },
    { name: "Sunnyvale", minutes: 69, tier: 0 },
    { name: "Lawrence", minutes: 73, tier: 2 },
    { name: "Santa Clara", minutes: 78, tier: 1 },
    { name: "College Park", minutes: 81, tier: 2 },
    { name: "San Jose Diridon", minutes: 86, tier: 0 },
    { name: "Tamien", minutes: 92, tier: 1 },
    { name: "Capitol", minutes: 100, tier: 2 },
    { name: "Blossom Hill", minutes: 104, tier: 2 },
    { name: "Morgan Hill", minutes: 113, tier: 1 },
    { name: "San Martin", minutes: 119, tier: 2 },
    { name: "Gilroy", minutes: 126, tier: 1 },
  ];

  const kinds = [
    { name: "Local", type: "outline", pace: 1, tier: 2 },
    { name: "Limited", type: "blue", pace: 0.9, tier: 1 },
    { name: "Express", type: "red", pace: 0.8, tier: 0 },
  ];

  const diridon = stations.findIndex((s) => s.name === "San Jose Diridon");

  // Minutes after midnight, or null where the train does not stop.
  const trains = Array.from({ length: 40 }, (_, i) => {
    const kind = kinds[i % 7 === 3 ? 2 : i % 4 === 1 ? 1 : 0];
    const start = 310 + i * 26 + (i % 3) * 3;
    const last = kind.tier === 2 && i % 5 === 0 ? stations.length - 1 : diridon;
    return {
      number: String(kinds.indexOf(kind) * 100 + 101 + i),
      kind,
      times: stations.map((s, j) =>
        s.tier <= kind.tier && j <= last
          ? start + Math.round(s.minutes * kind.pace)
          : null,
      ),
    };
  });

  const clock = (minutes) => {
    const hour = Math.floor(minutes / 60) % 24;
    const label = `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")}`;
    return label + (hour < 12 ? "a" : "p");
  };

  // The server renders 7:40 a.m.; the browser swaps in the real time.
  let now = 460;
  onMount(() => {
    const date = new Date();
    now = date.getHours() * 60 + date.getMinutes();
  });

  // Per station, the first train that has not left yet, or the first train of
  // the next day.
  $: next = stations.map((_, j) => {
    const upcoming = trains.findIndex((t) => t.times[j] >= now);
    return upcoming < 0
      ? trains.findIndex((t) => t.times[j] != null)
      : upcoming;
  });

  let orientation = 0;
  $: byStation = orientation === 0;

  $: headers = byStation
    ? [
        {
          key: "label",
          value: "Station",
          columnPinned: "start",
          width: "9.5rem",
        },
        ...trains.map((t, i) => ({
          key: `c${i}`,
          value: t.number,
          width: "6.5rem",
        })),
      ]
    : [
        { key: "label", value: "Train", columnPinned: "start", width: "9rem" },
        ...stations.map((s, j) => ({
          key: `c${j}`,
          value: s.name,
          width: "7.5rem",
        })),
      ];

  $: rows = byStation
    ? stations.map((s, j) => ({
        id: j,
        label: s.name,
        ...Object.fromEntries(trains.map((t, i) => [`c${i}`, t.times[j]])),
      }))
    : trains.map((t, i) => ({
        id: i,
        label: t.number,
        ...Object.fromEntries(stations.map((_, j) => [`c${j}`, t.times[j]])),
      }));

  const trainOf = (row, key) => (byStation ? Number(key.slice(1)) : row.id);
  const stationOf = (row, key) => (byStation ? row.id : Number(key.slice(1)));
</script>

<Stack gap={5}>
  <Box maxWidth="24rem">
    <ContentSwitcher bind:selectedIndex={orientation} size="sm">
      <Switch text="Stations down" />
      <Switch text="Trains down" />
    </ContentSwitcher>
  </Box>
  <Box maxWidth="64rem">
    <DataTable
      title="Southbound weekday timetable"
      description="The next departure from each station is highlighted."
      fixedLayout
      crosshair
      cellFocus
      stickyHeader
      stickyHeaderMaxHeight={480}
      {headers}
      {rows}
    >
      <svelte:fragment slot="cellHeader" let:header>
        {#if byStation && header.key !== "label"}
          {@const train = trains[Number(header.key.slice(1))]}
          <Stack gap={2} align="start">
            <strong>{header.value}</strong>
            <Tag size="sm" type={train.kind.type}>{train.kind.name}</Tag>
          </Stack>
        {:else}
          {header.value}
        {/if}
      </svelte:fragment>
      <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "label"}
          {#if byStation}
            {cell.value}
          {:else}
            <Stack orientation="horizontal" gap={3} align="center">
              <strong>{cell.value}</strong>
              <Tag size="sm" type={trains[row.id].kind.type}>
                {trains[row.id].kind.name}
              </Tag>
            </Stack>
          {/if}
        {:else if cell.value == null}
          <span aria-hidden="true">—</span>
          <span class="bx--visually-hidden">No stop</span>
        {:else if next[stationOf(row, cell.key)] === trainOf(row, cell.key)}
          <span class="next">
            <span class="bx--visually-hidden">Next departure</span>
            {clock(cell.value)}
          </span>
        {:else}
          {clock(cell.value)}
        {/if}
      </svelte:fragment>
    </DataTable>
  </Box>
</Stack>

<style>
  .next {
    padding: 0.125rem 0.5rem;
    background: var(--cds-background-brand);
    color: var(--cds-text-on-color);
    outline: 2px solid transparent;
    font-weight: 600;
  }
</style>
