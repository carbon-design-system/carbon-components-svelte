<script>
  import { Button } from "carbon-components-svelte";

  let clickCount = 0;
</script>

<Button data-testid="button-primary" on:click={() => (clickCount += 1)}>
  Primary
</Button>

<Button data-testid="button-disabled" disabled={true}>Disabled</Button>

<Button kind="secondary" data-testid="button-secondary">Secondary</Button>

{#if clickCount > 0}
  <p data-testid="click-count">Clicked: {clickCount}</p>
{/if}

<div data-testid="shortcut-kinds">
  <Button data-kind="primary" shortcut="ctrl+s">Save</Button>
  <Button data-kind="secondary" kind="secondary" shortcut="ctrl+s">Save</Button>
  <Button data-kind="tertiary" kind="tertiary" shortcut="ctrl+s">Save</Button>
  <Button data-kind="ghost" kind="ghost" shortcut="ctrl+s">Save</Button>
  <Button data-kind="danger" kind="danger" shortcut="ctrl+d">Delete</Button>
  <Button data-kind="danger-tertiary" kind="danger-tertiary" shortcut="ctrl+d">
    Delete
  </Button>
  <Button data-kind="danger-ghost" kind="danger-ghost" shortcut="ctrl+d">
    Delete
  </Button>
  <Button data-kind="disabled" shortcut="ctrl+e" disabled>Export</Button>
</div>
