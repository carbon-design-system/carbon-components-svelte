<script lang="ts">
  import CohortTable from "carbon-components-svelte/viz/CohortTable/CohortTable.svelte";

  type Cohort = { id: string; label: string; size?: number; values: number[] };

  export let rows: Cohort[] = [
    { id: "jan", label: "Jan", size: 1000, values: [1, 0.6, 0.5] },
    { id: "feb", label: "Feb", size: 3000, values: [1, 0.4] },
    { id: "mar", label: "Mar", size: 2000, values: [1] },
  ];
  export let summary: "none" | "average" = "none";
  export let selectable = false;
  export let selected: { id: string | number; period: number } | null = null;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<CohortTable
  {rows}
  title="Retention by signup month"
  sizeHeader="Users"
  locale="en-US"
  {summary}
  {selectable}
  bind:selected
  data-testid="cohort"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected"
  >{selected ? `${selected.id}/${selected.period}` : ""}</output
>
