<svelte:options accessors />

<script lang="ts">
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";

  export let controlId = "email";
  export let disabled = false;
  export let custom = false;
</script>

<FormItem {controlId} {disabled} let:control let:controlId={slotControlId}>
  <FormLabel>Email</FormLabel>
  {#if custom}
    <div
      role="combobox"
      aria-controls="menu"
      aria-expanded="false"
      tabindex="0"
      use:control
      data-testid="control"
    ></div>
  {:else}
    <input aria-describedby="own" use:control data-testid="control">
  {/if}
  <span data-testid="slot-control-id">{slotControlId}</span>
</FormItem>
