<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = [];
  /** @type {import("../field-config.js").FieldNode} */
  export let field;
  /** @type {string | undefined} */
  export let id = undefined;
  /** @type {string | undefined} */
  export let name = undefined;
  /** @type {string} */
  export let label = "";
  /** @type {string} */
  export let helperText = "";
  /** @type {boolean} */
  export let invalid = false;
  /** @type {string} */
  export let invalidText = "";
  /** @type {boolean} */
  export let disabled = false;
  /** @type {boolean} */
  export let required = false;

  import { createEventDispatcher } from "svelte";
  import FormRequirement from "../../FormRequirement/FormRequirement.svelte";
  import ToggleButton from "../../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../../ToggleButtonGroup/ToggleButtonGroup.svelte";
  import { deepEqual } from "../../utils/deep-equal.js";

  const dispatch = createEventDispatcher();
  /** @type {any[]} */
  let selected = Array.isArray(value) ? value : [];
  $: pull(value);
  $: push(selected);

  /** @param {any} next */
  function pull(next) {
    const list = Array.isArray(next) ? next : [];
    if (!deepEqual(list, selected)) selected = list;
  }

  /** @param {any[]} next */
  function push(next) {
    if (!deepEqual(next, Array.isArray(value) ? value : [])) {
      dispatch("change", next);
    }
  }
  // This widget has no use for name, placeholder, warn, warnText, readonly.
  $$restProps;
</script>

<div {id}>
  <!-- ToggleButtonGroup has no name, so the selection posts through these. -->
  {#each selected as chosen (chosen)}
    {#if name}<input type="hidden" {name} value={chosen} />{/if}
  {/each}
  <ToggleButtonGroup
    bind:selected
    labelText={label}
    {disabled}
    {required}
    aria-describedby={invalid
      ? `${id}-error`
      : helperText
        ? `${id}-helper`
        : undefined}
    {...field.config.props}
  >
    {#each field.options ?? [] as option (option.value)}
      <ToggleButton
        value={/** @type {string | number} */ (option.value)}
        disabled={option.disabled}
      >
        {option.label}
      </ToggleButton>
    {/each}
  </ToggleButtonGroup>
  {#if invalid}
    <FormRequirement id="{id}-error">{invalidText}</FormRequirement>
  {:else if helperText}
    <div class="bx--form__helper-text" id="{id}-helper">{helperText}</div>
  {/if}
</div>
