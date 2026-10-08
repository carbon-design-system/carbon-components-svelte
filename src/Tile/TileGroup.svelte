<script>
  /**
   * @template {string} [T=string]
   * @event {T} select
   */

  /**
   * Specify the selected tile value.
   * Follows the field after a reset — becomes the value of whichever tile
   * is checked in the DOM, or `undefined`.
   * @type {T | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /** Set to `true` to disable the tile group */
  export let disabled = false;

  /**
   * Set to `true` to require the selection of a radio button. A wrapping
   * `<form>` blocks submission while none is selected, and the group shows
   * `requiredInvalidText` below the tiles instead of the browser's error
   * bubble.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify the invalid state text shown when a required group blocks
   * submission. Cleared once a tile is selected.
   */
  export let requiredInvalidText = "Select an option";

  /**
   * Specify a name attribute for the radio button inputs.
   * Overrides each tile's own `name`. When neither is set, the tiles share
   * a generated id so they form one radio group; set a name explicitly when
   * form submission matters.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <TileGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   * </TileGroup>
   * ```
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { get, readonly, writable } from "svelte/store";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { requiredInvalid } from "../utils/required-invalid.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  /** @type {HTMLFieldSetElement | undefined} */
  let fieldsetRef;
  /**
   * @type {import("svelte/store").Writable<T | undefined>}
   */
  const selectedValue = writable(selected);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const groupName = writable(name || undefined);
  // Unnamed radios are separate controls, so arrow keys would not move
  // between tiles. Tiles with no name of their own share this one when the
  // group has no `name` either.
  const fallbackName = uniqueId();
  /**
   * @type {import("svelte/store").Writable<boolean | undefined>}
   */
  const groupRequired = writable(required);
  /**
   * @type {import("svelte/store").Readable<string | undefined>}
   */
  const groupNameReadonly = readonly(groupName);
  /**
   * @type {import("svelte/store").Readable<boolean | undefined>}
   */
  const groupRequiredReadonly = readonly(groupRequired);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const groupDisabled = writable(disabled);
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const groupDisabledReadonly = readonly(groupDisabled);

  /**
   * How many mounted tiles carry each value.
   * @type {Map<T, number>}
   */
  const mountedValues = new Map();

  /**
   * @type {(data: { checked: boolean; value: T }) => void}
   */
  function add({ checked, value }) {
    mountedValues.set(value, (mountedValues.get(value) ?? 0) + 1);
    if (checked) {
      selectedValue.set(value);
    }
  }

  /**
   * @type {(value: T) => void}
   */
  function remove(value) {
    const count = (mountedValues.get(value) ?? 0) - 1;
    if (count > 0) mountedValues.set(value, count);
    else mountedValues.delete(value);
    // An `{#if}` swap or re-render destroys a tile before mounting its
    // replacement, so wait for the flush before deciding the value is gone.
    // Then drop a selection no radio carries anymore, as the browser does.
    queueMicrotask(() => {
      if (!mountedValues.has(value) && get(selectedValue) === value) {
        selectedValue.set(undefined);
      }
    });
  }

  /**
   * @type {(value: T) => void}
   */
  function update(value) {
    selectedValue.set(value);
    dispatch("select", value);
  }

  function handleFormReset() {
    if (!fieldsetRef) return;
    // formReset is task-deferred, so the browser has already restored every
    // tile's radio to its own default: checked when the markup carried a
    // `checked` attribute (server-rendered), unchecked otherwise. Read the
    // winner back, or none. `selectedValue.set` alone reaches `selected` via
    // the existing `$: selected = $selectedValue;` — do not call `update()`,
    // which also dispatches `select`; a reset fires no events.
    const checkedInput = /** @type {HTMLInputElement | null} */ (
      fieldsetRef.querySelector('input[type="radio"]:checked')
    );
    selectedValue.set(checkedInput ? checkedInput.value : undefined);
  }

  setContext("carbon:TileGroup", {
    selectedValue,
    groupName: groupNameReadonly,
    fallbackName,
    groupRequired: groupRequiredReadonly,
    groupDisabled: groupDisabledReadonly,
    add,
    remove,
    update,
  });

  const errorId = uniqueId();
  /** Set when the group, required and empty, blocked form submission. */
  let requiredError = false;
  $: if (!required || $selectedValue != null) requiredError = false;

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: groupName.set(name || undefined);
  $: groupRequired.set(required);
  $: groupDisabled.set(disabled);
</script>

<fieldset
  bind:this={fieldsetRef}
  use:formReset={handleFormReset}
  use:requiredInvalid={{ onChange: (missing) => (requiredError = missing) }}
  {disabled}
  aria-describedby={requiredError ? errorId : undefined}
  class:bx--tile-group={true}
  class:bx--tile-group--invalid={requiredError}
  {...$$restProps}
>
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div><slot /></div>
  {#if requiredError}
    <div class:bx--tile-group__validation-msg={true}>
      <WarningFilled class="bx--tile-group__invalid-icon" />
      <div id={errorId} class:bx--form-requirement={true}>
        {requiredInvalidText}
      </div>
    </div>
  {/if}
</fieldset>
