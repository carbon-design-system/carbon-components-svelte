<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Tearsheet from "carbon-components-svelte/Tearsheet/Tearsheet.svelte";

  let open = [false, false, false, false];
</script>

<Button on:click={() => (open[0] = true)}>Open first</Button>
<Button on:click={() => (open[3] = true)}>Open fourth first</Button>
{#each open as _, index (index)}
  <Tearsheet
    bind:open={open[index]}
    title="Sheet {index + 1}"
    data-testid="sheet-{index + 1}"
  >
    {#if index < 3}
      <Button on:click={() => (open[index + 1] = true)}>
        Open sheet {index + 2}
      </Button>
    {/if}
    {#if index > 0}
      <Button on:click={() => (open[index - 1] = true)}>
        Open earlier sheet {index}
      </Button>
    {/if}
  </Tearsheet>
{/each}
