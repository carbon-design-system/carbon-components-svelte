<script>
  import { ActionSet, Button } from "carbon-components-svelte";
</script>

<!-- Sets of two, three and four actions, in narrow boxes and a wide one. -->
{#each [240, 320, 1000] as width}
  {#each [2, 3, 4] as count}
    <div
      data-testid="set-{count}-{width}"
      style="width: {width}px; margin: 1rem;"
    >
      <ActionSet size={count === 3 ? "lg" : "xl"}>
        {#if count > 3}
          <Button kind="ghost">Learn more</Button>
        {/if}
        {#if count > 2}
          <Button kind="secondary">Cancel</Button>
        {/if}
        <Button kind="danger">Delete</Button>
        <Button>Save</Button>
      </ActionSet>
    </div>
  {/each}
{/each}

<div data-testid="set-fixed-320" style="width: 320px; margin: 1rem;">
  <ActionSet size="xl" disableStacking>
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </ActionSet>
</div>
