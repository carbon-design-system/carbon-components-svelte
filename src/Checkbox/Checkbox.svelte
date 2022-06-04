<script>
  /**
   * @event {boolean} check
   */

  /**
   * Specify the value of the checkbox
   * @type {any}
   */
  export let value = "";

  /** Specify whether the checkbox is checked */
  export let checked = false;

  /**
   * Specify the bound group
   * @type {ReadonlyArray<any>}
   */
  export let group = undefined;

  /** Specify whether the checkbox is indeterminate */
  export let indeterminate = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` for the checkbox to be read-only */
  export let readonly = false;

  /** Set to `true` to disable the checkbox */
  export let disabled = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set a name for the input element */
  export let name = "";

  /**
   * Specify the title attribute for the label element
   * @type {string}
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import CheckboxSkeleton from "./CheckboxSkeleton.svelte";

  const dispatch = createEventDispatcher();

  $: useGroup = Array.isArray(group);
  $: checked = useGroup ? group.includes(value) : checked;
  $: dispatch("check", checked);

  let refLabel = null;

  $: isTruncated = refLabel?.offsetWidth < refLabel?.scrollWidth;
  $: title = !title && isTruncated ? refLabel?.innerText : title;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <CheckboxSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <div
    class:bx--form-item="{true}"
    class:bx--checkbox-wrapper="{true}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <input
      bind:this="{ref}"
      type="checkbox"
      value="{value}"
      checked="{checked}"
      disabled="{disabled}"
      id="{id}"
      indeterminate="{indeterminate}"
      name="{name}"
      required="{required}"
      readonly="{readonly}"
      class:bx--checkbox="{true}"
      on:change="{() => {
        if (useGroup) {
          group = group.includes(value)
            ? group.filter((_value) => _value !== value)
            : [...group, value];
        } else {
          checked = !checked;
        }
      }}"
      on:change
      on:blur
    />
    <label for="{id}" title="{title}" class:bx--checkbox-label="{true}">
      <span
        bind:this="{refLabel}"
        class:bx--checkbox-label-text="{true}"
        class:bx--visually-hidden="{hideLabel}"
      >
        <slot name="labelText">
          {labelText}
        </slot>
      </span>
    </label>
  </div>
{/if}
