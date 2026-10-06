<script>
  import { Button, rovingFocus } from "carbon-components-svelte";

  const environments = ["Production", "Staging", "Development"];
  let active = 0;
</script>

<div
  role="toolbar"
  aria-orientation="vertical"
  aria-label="Environments"
  style="display: flex; flex-direction: column; gap: var(--cds-spacing-03); width: 12rem"
  use:rovingFocus={{
    selector: "button",
    orientation: "vertical",
    getActiveIndex: () => active,
    onMove: (index) => (active = index),
    focusOnMove: true,
  }}
>
  {#each environments as environment, i}
    <Button
      kind="tertiary"
      size="small"
      tabindex={i === active ? 0 : -1}
      on:focus={() => (active = i)}
    >
      {environment}
    </Button>
  {/each}
</div>
