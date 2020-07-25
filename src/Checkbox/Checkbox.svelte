<script>
  /**
   * Specify whether the checkbox is checked
   * @type {boolean} [checked=false]
   */
  export let checked = false;

  /**
   * Specify whether the checkbox is indeterminate
   * @type {boolean} [indeterminate=false]
   */
  export let indeterminate = false;

  /**
   * Set to `true` to display the skeleton state
   * @type {boolean} [skeleton=false]
   */
  export let skeleton = false;

  /**
   * Set to `true` for the checkbox to be read-only
   * @type {boolean} [readonly=false]
   */
  export let readonly = false;

  /**
   * Set to `true` to disable the checkbox
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Define the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;

  /**
   * Set a name for the input element
   * @type {string} [name=""]
   */
  export let name = "";

  /**
   * Specify the title attribute for the label element
   * @type {string} [title]
   */
  export let title = undefined;

  /**
   * Set an id for the input label
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLElement} [ref=null]
   */
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
    <label for={id} {title} class:bx--checkbox-label={true}>
      <span
        class:bx--checkbox-label-text={true}
        class:bx--visually-hidden={hideLabel}>
        {labelText}
      </span>
    </label>
  </div>
{/if}
