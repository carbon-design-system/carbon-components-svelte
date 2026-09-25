<script>
  /**
   * @template {string} [T=string]
   * @event {T} select
   */

  /**
   * Specify the selected tile value. Follows the field after a reset —
   * becomes the value of whichever tile is checked in the DOM, or
   * `undefined`.
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
   * Specify a name attribute for the radio button inputs. Overrides
   * each tile's own `name`. When neither is set, the tiles share a
   * generated id so they form one radio group; set a name explicitly
   * when form submission matters.
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

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
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
   * @type {(data: { checked: boolean; value: T }) => void}
   */
  function add({ checked, value }) {
    if (checked) {
      selectedValue.set(value);
    }
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
    add,
    update,
  });

  $: selected = $selectedValue;
  $: selectedValue.set(selected);
  $: groupName.set(name || undefined);
  $: groupRequired.set(required);
</script>

<fieldset
  bind:this={fieldsetRef}
  use:formReset={handleFormReset}
  {disabled}
  class:bx--tile-group={true}
  {...$$restProps}
>
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  <div><slot /></div>
</fieldset>
