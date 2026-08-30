<script lang="ts">
  import ActionSet from "carbon-components-svelte/ActionSet/ActionSet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let size: "sm" | "md" | "lg" | "xl" | "2xl" = "md";
  export let disableStacking = false;
  export let count = 2;
</script>

<ActionSet data-testid="action-set" {size} {disableStacking}>
  <Button kind="secondary">Cancel</Button>
  {#if count >= 2}
    <Button kind="danger">Delete</Button>
  {/if}
  {#if count >= 3}
    <Button>Save</Button>
  {/if}
</ActionSet>
