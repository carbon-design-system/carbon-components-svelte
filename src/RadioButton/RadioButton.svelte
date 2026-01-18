<script>
  /**
   * Specify the value of the radio button.
   * @type {string | number}
   */
  export let value = "";

  /** Set to `true` to check the radio button */
  export let checked = false;

  /** Set to `true` to disable the radio button */
  export let disabled = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Specify the label position.
   * @type {"right" | "left"}
   */
  export let labelPosition = "right";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the radio button input.
   * When multiple standalone RadioButton components share the same `name`,
   * they form an implicit group and their `checked` state will be synchronized.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import {
    registerRadioButton,
    updateGroupSelection,
  } from "./RadioButtonRegistry.js";

  const ctx = getContext("RadioButtonGroup");

  const { add, update, selectedValue, groupName, groupRequired } = ctx ?? {
    groupName: readable(undefined),
    groupRequired: readable(undefined),
    selectedValue: readable(checked ? value : undefined),
  };

  // Track if we're in standalone mode (no RadioButtonGroup context)
  const isStandalone = !ctx;

  // Unique key for this component instance (used for registry identity)
  // Using an object reference guarantees uniqueness across all instances
  const instanceKey = {};

  // Registry state for standalone mode with name
  /** @type {import("svelte/store").Writable<{} | undefined> | null} */
  let registryStore = null;
  /** @type {(() => void) | null} */
  let unregister = null;
  /** @type {(() => void) | null} */
  let registryUnsubscribe = null;
  /** @type {string | undefined} */
  let previousName = undefined;

  /**
   * Initialize registry for standalone mode with name.
   * @param {string | undefined} radioName
   */
  function initRegistry(radioName) {
    // Clean up previous registration if any
    cleanupRegistry();

    if (isStandalone && radioName) {
      const registration = registerRadioButton(radioName, instanceKey, checked);
      registryStore = registration.selectedKey;
      unregister = registration.unregister;

      // Subscribe to uncheck this radio when a sibling is selected.
      // Only set checked=false when another instance is selected, not checked=true for self.
      // This allows parent components (like DataTable) to control the checked state.
      registryUnsubscribe = registryStore.subscribe((selectedKey) => {
        if (selectedKey !== undefined && selectedKey !== instanceKey) {
          checked = false;
        }
      });

      previousName = radioName;
    }
  }

  function cleanupRegistry() {
    if (registryUnsubscribe) {
      registryUnsubscribe();
      registryUnsubscribe = null;
    }
    if (unregister) {
      unregister();
      unregister = null;
    }
    registryStore = null;
    previousName = undefined;
  }

  // Handle name prop changes reactively
  $: if (isStandalone && name !== previousName) {
    initRegistry(name);
  }

  if (add) {
    add({ id, checked, disabled, value });
  }

  // Only sync checked when inside RadioButtonGroup.
  // This allows standalone `RadioButton` usage.
  $: if (add) {
    checked = $selectedValue === value;
  }

  onMount(() => {
    return () => {
      cleanupRegistry();
    };
  });
</script>

<div
  class:bx--radio-button-wrapper={true}
  class:bx--radio-button-wrapper--label-left={labelPosition === "left"}
  {...$$restProps}
>
  <input
    bind:this={ref}
    type="radio"
    {id}
    name={$groupName ?? name}
    {checked}
    {disabled}
    required={$groupRequired ?? required}
    {value}
    class:bx--radio-button={true}
    on:focus
    on:blur
    on:change
    on:change={(e) => {
      if (update) {
        // Inside RadioButtonGroup - use context
        update(value);
      } else if (name && registryStore) {
        // Standalone with name - update local checked and notify siblings via registry
        checked = e.currentTarget.checked;
        updateGroupSelection(name, instanceKey);
      } else {
        // Standalone without name - just update local checked
        checked = e.currentTarget.checked;
      }
    }}
  />
  <label class:bx--radio-button__label={true} for={id}>
    <span class:bx--radio-button__appearance={true}></span>
    {#if labelText || $$slots.labelChildren}
      <span class:bx--visually-hidden={hideLabel}>
        <slot name="labelChildren">
          {labelText}
        </slot>
      </span>
    {/if}
  </label>
</div>
