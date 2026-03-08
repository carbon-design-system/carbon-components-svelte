<script>
  import { Button } from "carbon-components-svelte";

  let clickCount = 0;
</script>

<Button data-testid="button-primary" on:click={() => (clickCount += 1)}>
  Primary
</Button>

<Button data-testid="button-disabled" disabled={true}> Disabled </Button>

<Button kind="secondary" data-testid="button-secondary"> Secondary </Button>

{#if clickCount > 0}
  <p data-testid="click-count">Clicked: {clickCount}</p>
{/if}
