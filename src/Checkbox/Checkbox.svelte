<script>
  export let skeleton = false;
  export let indeterminate = false;
  export let readonly = false;
  export let checked = false;
  export let disabled = false;
  export let labelText = "";
  export let hideLabel = false;
  export let id = "ccs-" + Math.random().toString(36);
  export let name = "";
  export let title = undefined;
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import CheckboxSkeleton from "./Checkbox.Skeleton.svelte";

  const dispatch = createEventDispatcher();

  $: dispatch("check", checked);
</script>

{#if skeleton}
  <CheckboxSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  <div
    class:bx--form-item={true}
    class:bx--checkbox-wrapper={true}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <input
      bind:this={ref}
      type="checkbox"
      {checked}
      {disabled}
      {id}
      {indeterminate}
      {name}
      {readonly}
      class:bx--checkbox={true}
      on:change
      on:change={() => {
        checked = !checked;
      }} />
    <label class:bx--checkbox-label={true} for={id} {title}>
      <span
        class:bx--checkbox-label-text={true}
        class:bx--visually-hidden={hideLabel}>
        {labelText}
      </span>
    </label>
  </div>
{/if}
