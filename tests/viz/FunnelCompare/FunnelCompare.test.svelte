<script lang="ts">
  import FunnelCompare from "carbon-components-svelte/viz/FunnelCompare/FunnelCompare.svelte";

  const organic = [
    { id: "visit", label: "Visit", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "paid", label: "Paid", value: 1200 },
  ];
  const paid = [
    { id: "visit", label: "Visit", value: 8000 },
    { id: "signup", label: "Signup", value: 3000 },
    { id: "trial", label: "Trial", value: 1500 },
    { id: "paid", label: "Paid", value: 640 },
  ];
  export let funnels = [
    { id: "organic", label: "Organic", stages: organic },
    { id: "paid", label: "Paid", stages: paid, color: "success" },
  ];
  export let scale: "shared" | "independent" = "shared";
  export let rate: "overall" | "none" = "overall";
  export let label = "Signup funnel by channel";
  export let selectable = false;
  export let selected: { funnel: string; stage: string } | null = null;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<FunnelCompare
  {funnels}
  {label}
  {scale}
  {rate}
  {selectable}
  bind:selected
  data-testid="compare"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected"
  >{selected ? `${selected.funnel}/${selected.stage}` : ""}</output
>
