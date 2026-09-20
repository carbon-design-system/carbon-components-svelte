<script lang="ts">
  import FunnelBars from "carbon-components-svelte/viz/FunnelBars/FunnelBars.svelte";

  type Stage = {
    id: string;
    label: string;
    value: number;
    color?: string;
    href?: string;
  };

  export let stages: ReadonlyArray<Stage> = [
    { id: "visit", label: "Visitors", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "activate", label: "Activated", value: 3000 },
    { id: "paid", label: "Paid", value: 900 },
  ];
  export let label = "Signup funnel";
  export let rate: "none" | "step" | "overall" | "both" = "overall";
  export let showDrop = false;
  export let highlight: string = "none";
  export let scale: "linear" | "sqrt" = "linear";
  export let align: "start" | "center" = "start";
  export let selectable = false;
  export let selectedId: string | undefined = undefined;
  export let emitUpdate = false;
  export let color: string | number = "interactive";
  export let withSlots = false;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
  export let onupdate: (detail: unknown) => void = () => {};
</script>

{#if withSlots}
  <FunnelBars {stages} {label} rate="step" data-testid="funnel">
    <svelte:fragment slot="label" let:stage let:index
      >{index + 1}. {stage.label}</svelte:fragment
    >
    <svelte:fragment slot="value" let:formattedValue
      >[{formattedValue}]</svelte:fragment
    >
    <svelte:fragment slot="rate" let:stats let:kind
      >{kind}:{stats.stepRate ?? "n/a"}</svelte:fragment
    >
  </FunnelBars>
{:else}
  <FunnelBars
    {stages}
    {label}
    {rate}
    {showDrop}
    {highlight}
    {scale}
    {align}
    {selectable}
    {emitUpdate}
    {color}
    bind:selectedId
    data-testid="funnel"
    on:select={(e) => onselect(e.detail)}
    on:hover={(e) => onhover(e.detail)}
    on:update={(e) => onupdate(e.detail)}
  />
{/if}

<output data-testid="selected">{selectedId ?? ""}</output>
