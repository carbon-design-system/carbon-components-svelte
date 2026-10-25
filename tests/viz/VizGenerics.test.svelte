<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";
  import ComboChart from "carbon-components-svelte/viz/ComboChart/ComboChart.svelte";
  import DonutChart from "carbon-components-svelte/viz/DonutChart/DonutChart.svelte";
  import FlameGraph from "carbon-components-svelte/viz/FlameGraph/FlameGraph.svelte";
  import GanttChart from "carbon-components-svelte/viz/GanttChart/GanttChart.svelte";
  import LineChart from "carbon-components-svelte/viz/LineChart/LineChart.svelte";
  import RetentionChart from "carbon-components-svelte/viz/RetentionChart/RetentionChart.svelte";

  // The row type flows from `data` into the accessor props, on the core
  // chart, on the presets that extend it, and on the standalone charts, so a
  // key that is not a field is a type error.
  const rows = [
    { date: "Jan", revenue: 10, region: "EMEA" },
    { date: "Feb", revenue: 12, region: "EMEA" },
  ];
  const frames = [{ id: "main", parent: null, ms: 10, fn: "main" }];
  const tasks = [{ id: "a", name: "Spec", from: new Date(), to: new Date() }];

  let hovered: { date: string; revenue: number; region: string } | null = null;

  // Never called: these exist for `test:types`. Constructing a component
  // infers its row type from `props.data` the way the markup does, so a
  // key that is not a field must fail to type-check. The class form is the
  // one svelte-check types, hence the legacy warning is ignored.
  function _inferredKeysAreChecked() {
    const t = document.body;
    const combo = {
      data: rows,
      x: "date",
      y: "revenue",
      series: "nope",
    } as const;
    const flame = {
      data: frames,
      id: "id",
      parent: "parent",
      value: "ms",
      label: "nope",
    } as const;
    const line = { data: rows, x: "nope", y: "revenue" } as const;
    const donut = { data: rows, value: "nope", category: "region" } as const;
    const gantt = {
      data: tasks,
      id: "id",
      label: "nope",
      start: "from",
      end: "to",
    } as const;
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the rows
    new Chart({ target: t, props: { data: rows, x: "date", y: "nope" } });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the rows
    new LineChart({ target: t, props: line });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the rows
    new ComboChart({ target: t, props: combo });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the rows
    new RetentionChart({ target: t, props: line });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the frames
    new FlameGraph({ target: t, props: flame });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the tasks
    new GanttChart({ target: t, props: gantt });
    // svelte-ignore legacy_component_creation
    // @ts-expect-error "nope" is not a field of the rows
    new DonutChart({ target: t, props: donut });
    // svelte-ignore legacy_component_creation
    new LineChart({
      target: t,
      props: {
        data: rows,
        x: "date",
        y: "revenue",
        // @ts-expect-error the comparator sees the row type
        tooltip: { sort: (a, b) => a.datum.nope - b.datum.nope },
      },
    });
  }
</script>

<Chart
  data={rows}
  x="date"
  y="revenue"
  series="region"
  on:select={(e) => (hovered = e.detail.datum)}
>
  <ChartLine />
</Chart>
<LineChart
  data={rows}
  x="date"
  y={(row) => row.revenue * 2}
  series="region"
  tooltip={{ sort: (a, b) => a.datum.revenue - b.datum.revenue }}
/>
<ComboChart data={rows} x="date" y="revenue" series="region" bars={["EMEA"]} />
<RetentionChart data={rows} x="date" y="revenue" series="region" />
<FlameGraph data={frames} id="id" parent="parent" value="ms" label="fn" />
<GanttChart data={tasks} id="id" label="name" start="from" end="to" />
<DonutChart data={rows} value="revenue" category="region" />

<output>{hovered?.region}</output>
