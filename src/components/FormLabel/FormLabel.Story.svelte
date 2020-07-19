<script>
  export let story = undefined;

  import { Tooltip } from "../Tooltip";
  import FormLabel from "./FormLabel.svelte";
</script>

{#if story === 'tooltip'}
  <FormLabel>
    <Tooltip triggerText="Label">This is the content of the tooltip.</Tooltip>
  </FormLabel>
{:else}
  <FormLabel>Label</FormLabel>
{/if}
