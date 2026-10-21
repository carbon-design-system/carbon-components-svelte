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
  export let extraHelper = false;
  export let error = false;
  export let ariaInvalid: "true" | undefined = undefined;
  export let errorKind: "invalid" | "warn" = "invalid";
  export let errorId: string | undefined = undefined;
  export let helperId: string | undefined = undefined;
  export let showLabel = true;
  export let labelFor: string | undefined = undefined;
  export let labelDisabled: boolean | undefined = undefined;
  export let helperDisabled: boolean | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
</script>

<FormItem {controlId} {disabled} let:control let:controlId={slotControlId}>
  {#if showLabel}
    <FormLabel for={labelFor} disabled={labelDisabled}>Email</FormLabel>
  {/if}
  {#if custom}
    <div
      role="combobox"
      aria-controls="menu"
      aria-expanded="false"
      aria-label={ariaLabel}
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
    <FormHelperText id={helperId} disabled={helperDisabled}>
      Helper
    </FormHelperText>
  {/if}
  {#if extraHelper}
    <FormHelperText>More help</FormHelperText>
  {/if}
  {#if error}
    <FormRequirement kind={errorKind} id={errorId}>Error</FormRequirement>
  {/if}
  <span data-testid="slot-control-id">{slotControlId}</span>
</FormItem>
