<script lang="ts">
  import EventTimeline from "carbon-components-svelte/viz/EventTimeline/EventTimeline.svelte";

  type Row = { at: Date; type: string; name: string; env: string };

  const at = (hour: number, minute = 0) => new Date(2026, 0, 1, hour, minute);
  export let data: ReadonlyArray<Row> = [
    { at: at(0), type: "deploy", name: "v1.4.0", env: "prod" },
    { at: at(3), type: "alert", name: "Latency high", env: "prod" },
    { at: at(6), type: "rollback", name: "v1.3.9", env: "prod" },
    { at: at(12), type: "deploy", name: "v1.4.1", env: "staging" },
  ];
  export let withRows = false;
  export let selectable = false;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<EventTimeline
  {data}
  at="at"
  kind="type"
  label="name"
  row={withRows ? "env" : undefined}
  kinds={{ deploy: "info", alert: "warning", rollback: "error" }}
  title="Release events"
  locale="en-US"
  {selectable}
  bind:selected
  data-testid="events"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
