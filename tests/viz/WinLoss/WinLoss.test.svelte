<script lang="ts">
  import WinLoss from "carbon-components-svelte/viz/WinLoss/WinLoss.svelte";

  export let selectedIndex: number | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<WinLoss
  data={[1, 1, -1, 0, 1]}
  label="Last 5 experiments"
  showValue
  data-testid="basic"
/>
<WinLoss data={[1, -1]} data-testid="decorative" />
<WinLoss
  data={[
    { value: 3, label: "Mon" },
    { value: -2, label: "Tue" },
    { value: 0, label: "Wed" },
  ]}
  selectable
  bind:selectedIndex
  label="Pick a day"
  translations={{
    win: "Sieg",
    wins: "Siege",
    loss: "Niederlage",
    losses: "Niederlagen",
    tie: "Remis",
    ties: "Remis",
  }}
  data-testid="selectable"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selectedIndex ?? ""}</output>
