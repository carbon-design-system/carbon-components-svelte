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
   * Set to `true` to require the selection of a radio button.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the radio button inputs.
   * Overrides each tile's own `name`. When neither is set, the tiles share
   * a generated id so they form one radio group; set a name explicitly when
   * form submission matters.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the fieldset and radio tile inputs with. Overrides each tile's own `form`.
   * @type {string | undefined}
   */
  export let form = undefined;

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
  import { formReset } from "../utils/form-reset.js";
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
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const groupForm = writable(form);
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
    groupForm: readonly(groupForm),
    fallbackName,
    groupRequired: groupRequiredReadonly,
    groupDisabled: groupDisabledReadonly,
    add,
    remove,
    update,
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: groupName.set(name || undefined);
  $: groupForm.set(form);
  $: groupRequired.set(required);
  $: groupDisabled.set(disabled);
</script>

<fieldset
  bind:this={fieldsetRef}
  use:formReset={handleFormReset}
  {disabled}
  {form}
  class:bx--tile-group={true}
  {...$$restProps}
>
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div><slot /></div>
</fieldset>
