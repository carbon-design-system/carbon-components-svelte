<script>
  import { Button, rovingFocus, Stack } from "carbon-components-svelte";

  const actions = ["Restart", "Scale", "Rollback", "Delete"];
  let active = 0;
</script>

<Stack as orientation="horizontal" gap={3} let:props>
  <div
    {...props}
    role="toolbar"
    aria-label="Deployment actions"
    use:rovingFocus={{
      selector: "button",
      getActiveIndex: () => active,
      onMove: (index) => (active = index),
      focusOnMove: true,
    }}
  >
    {#each actions as action, i}
      <Button
        kind="tertiary"
        size="small"
        tabindex={i === active ? 0 : -1}
        on:focus={() => (active = i)}
      >
        {action}
      </Button>
    {/each}
  </div>
</Stack>
