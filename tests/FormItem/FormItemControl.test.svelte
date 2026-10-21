<svelte:options accessors />

<script lang="ts">
  import FormHelperText from "carbon-components-svelte/FormHelperText/FormHelperText.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
  import FormRequirement from "carbon-components-svelte/FormRequirement/FormRequirement.svelte";

  export let controlId = "email";
  export let disabled = false;
  export let custom = false;
  export let hint = "own";
  export let helper = false;
  export let error = false;
  export let ariaInvalid: "true" | undefined = undefined;
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
    <input
      aria-describedby={hint}
      aria-invalid={ariaInvalid}
      use:control
      data-testid="control"
    >
  {/if}
  {#if helper}
    <FormHelperText>Helper</FormHelperText>
  {/if}
  {#if error}
    <FormRequirement>Error</FormRequirement>
  {/if}
  <span data-testid="slot-control-id">{slotControlId}</span>
</FormItem>
