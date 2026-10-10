<script lang="ts">
  import UptimeBar from "carbon-components-svelte/viz/UptimeBar/UptimeBar.svelte";

  type Status = "ok" | "degraded" | "down" | "none";
  export let data: Array<{ status: Status; label?: string }> = [
    { status: "none", label: "Mar 1" },
    { status: "ok", label: "Mar 2" },
    { status: "degraded", label: "Mar 3" },
    { status: "down", label: "Mar 4" },
    { status: "ok", label: "Mar 5" },
  ];
  export let selectedIndex: number | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<UptimeBar {data} label="API" showValue data-testid="basic" />
<UptimeBar {data} data-testid="decorative" />
<UptimeBar
  {data}
  size="sm"
  fractionDigits={0}
  translations={{ uptime: "verfügbar", down: "Ausfall" }}
  selectable
  bind:selectedIndex
  label="API wählen"
  data-testid="selectable"
  on:select={(e) => onselect(e.detail)}
/>
<UptimeBar
  data={[{ status: "none" }]}
  label="New service"
  showValue
  data-testid="unmeasured"
/>
<output data-testid="selected">{selectedIndex ?? ""}</output>
