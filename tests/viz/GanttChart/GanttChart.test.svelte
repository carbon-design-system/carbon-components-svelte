<script lang="ts">
  import GanttChart from "carbon-components-svelte/viz/GanttChart/GanttChart.svelte";

  type Task = {
    id: string;
    name: string;
    stream: string;
    from: Date;
    to: Date;
    done?: number;
    after?: string;
  };

  const day = (d: number) => new Date(2026, 8, d);
  export let data: ReadonlyArray<Task> = [
    {
      id: "spec",
      name: "spec",
      stream: "Design",
      from: day(1),
      to: day(8),
      done: 1,
    },
    {
      id: "api",
      name: "checkout API",
      stream: "API",
      from: day(8),
      to: day(18),
      done: 0.5,
      after: "spec",
    },
    {
      id: "web",
      name: "storefront",
      stream: "Web",
      from: day(14),
      to: day(24),
      after: "api",
    },
  ];
  export let today: Date | undefined = undefined;
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<GanttChart
  {data}
  id="id"
  label="name"
  group="stream"
  start="from"
  end="to"
  progress="done"
  dependsOn="after"
  {today}
  title="Launch plan"
  width={600}
  rowHeight={20}
  locale="en-US"
  data-testid="gantt"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
