<script lang="ts">
  import StateTimeline from "carbon-components-svelte/viz/StateTimeline/StateTimeline.svelte";

  type Row = { service: string; status: string; from: Date; to: Date };

  const at = (hour: number) => new Date(2026, 0, 1, hour);
  export let data: ReadonlyArray<Row> = [
    { service: "api", status: "ok", from: at(0), to: at(6) },
    { service: "api", status: "down", from: at(6), to: at(7) },
    { service: "api", status: "ok", from: at(7), to: at(12) },
    { service: "worker", status: "degraded", from: at(0), to: at(12) },
  ];
  export let selectable = false;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<StateTimeline
  {data}
  row="service"
  state="status"
  start="from"
  end="to"
  states={{ ok: "success", down: "error", degraded: "warning" }}
  title="Service health"
  locale="en-US"
  {selectable}
  bind:selected
  data-testid="timeline"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
