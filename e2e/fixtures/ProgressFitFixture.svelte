<script>
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";

  const steps = ["Account", "Billing", "Region", "Review"];
</script>

<!-- Four steps in boxes narrower and wider than 512px, and a vertical
     indicator to compare the stacked layout against. -->
{#each [
  { id: "200", width: 200 },
  { id: "320", width: 320 },
  { id: "600", width: 600 },
  { id: "vertical", width: 320, vertical: true },
] as box}
  <div
    data-testid="progress-{box.id}"
    style="width: {box.width}px; margin: 1rem;"
  >
    <ProgressIndicator currentIndex={1} vertical={box.vertical}>
      {#each steps as label, i}
        <ProgressStep
          {label}
          complete={i < 1}
          secondaryLabel={i === 1 ? "Optional" : undefined}
        />
      {/each}
    </ProgressIndicator>
  </div>
{/each}
<!-- A flex row, where the indicator sizes to its steps. -->
<div
  data-testid="progress-flex"
  style="display: flex; width: 900px; margin: 1rem;"
>
  <ProgressIndicator currentIndex={1}>
    {#each steps as label}
      <ProgressStep {label} />
    {/each}
  </ProgressIndicator>
  <span>Next</span>
</div>
