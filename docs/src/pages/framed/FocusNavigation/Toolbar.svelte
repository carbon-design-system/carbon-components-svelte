<script>
  import {
    Button,
    createFocusNav,
    focusNav,
    Stack,
  } from "carbon-components-svelte";

  const actions = [
    { label: "Restart" },
    { label: "Scale" },
    { label: "Pause", disabled: true },
    { label: "Rollback", disabled: true },
    { label: "Delete" },
  ];

  const nav = createFocusNav({ selector: "button", skipDisabled: true });
</script>

<Stack as orientation="horizontal" gap={3} let:props>
  <div
    {...props}
    role="toolbar"
    aria-label="Deployment actions"
    use:focusNav={nav}
  >
    {#each actions as action, i (action.label)}
      <Button
        kind="tertiary"
        size="small"
        disabled={action.disabled}
        tabindex={i === $nav.tabStop ? 0 : -1}
      >
        {action.label}
      </Button>
    {/each}
  </div>
</Stack>
