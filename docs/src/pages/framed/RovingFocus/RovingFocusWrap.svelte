<script>
  import { Button, rovingFocus } from "carbon-components-svelte";

  const actions = [
    { label: "Restart", disabled: false },
    { label: "Scale", disabled: true },
    { label: "Rollback", disabled: false },
    { label: "Delete", disabled: false },
  ];
  let active = 0;
</script>

<div
  role="toolbar"
  aria-label="Deployment actions"
  style="display: flex; gap: var(--cds-spacing-03)"
  use:rovingFocus={{
    selector: "button",
    wrap: false,
    skipDisabled: true,
    getActiveIndex: () => active,
    onMove: (index) => (active = index),
    focusOnMove: true,
  }}
>
  {#each actions as action, i}
    <Button
      kind="tertiary"
      size="small"
      disabled={action.disabled}
      tabindex={i === active ? 0 : -1}
      on:focus={() => (active = i)}
    >
      {action.label}
    </Button>
  {/each}
</div>
