<script>
  /**
   * @template {string} [Value=string]
   * @template [Icon=any]
   * @event {Value | Value[]} change
   */

  /**
   * Specify the selected structured list row value.
   * When `multiple` is `true`, this is an array of selected values.
   * @type {Value | Value[] | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /** Set to `true` to use the condensed variant */
  export let condensed = false;

  /** Set to `true` to flush the list */
  export let flush = false;

  /** Set to `true` to use the selection variant */
  export let selection = false;

  /** Set to `true` to allow selecting multiple rows */
  export let multiple = false;

  /**
   * Specify the icon rendered in the selection column of selectable rows.
   * Only used when `selection` is `true`.
   * The icon is decorative; selection state is conveyed by each row's `aria-checked`.
   * @type {Icon}
   */
  export let icon = CheckmarkFilled;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<Value | Value[] | undefined>}
   */
  const selectedValue = writable(
    multiple ? (Array.isArray(selected) ? selected : []) : selected,
  );

  // Radios need a shared name to move on the arrow keys.
  const groupName = uniqueId("structured-list");
  const inputName = writable(selection && !multiple ? groupName : "");
  const multipleValue = writable(multiple);
  const selectionValue = writable(selection);
  const iconValue = writable(icon);
  /**
   * Values of the mounted `StructuredListInput`s, in insertion order.
   * @type {import("svelte/store").Writable<Value[]>}
   */
  const rowValues = writable([]);
  const batchedRowValuesUpdate = batchStoreUpdates(rowValues);

  let prevSelectedValue = $selectedValue;
  let prevMultiple = multiple;
  let initialRender = true;
  let fromProp = false;

  /**
   * @type {(value: Value) => void}
   */
  function update(value) {
    if (multiple) {
      selectedValue.update((current) => {
        const list = Array.isArray(current) ? current : [];
        return list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value];
      });
    } else {
      selectedValue.set(value);
    }
  }

  /**
   * @type {(value: Value) => void}
   */
  function register(value) {
    batchedRowValuesUpdate((values) => [...values, value]);
  }

  /**
   * @type {(value: Value) => void}
   */
  function unregister(value) {
    batchedRowValuesUpdate((values) => {
      const index = values.indexOf(value);
      return index === -1 ? values : values.filter((_, i) => i !== index);
    });
  }

  setContext("carbon:StructuredListWrapper", {
    selectedValue,
    update,
    register,
    unregister,
    rowValues: readonly(rowValues),
    multiple: readonly(multipleValue),
    selection: readonly(selectionValue),
    icon: readonly(iconValue),
    inputName,
  });

  onMount(() => {
    initialRender = false;
  });

  $: inputName.set(selection && !multiple ? groupName : "");
  $: selected = $selectedValue;
  $: $multipleValue = multiple;
  $: $selectionValue = selection;
  $: $iconValue = icon;
  $: if (multiple !== prevMultiple) {
    prevMultiple = multiple;
    // Coerce the value to the new mode. This is a parent write, not a
    // user selection, so it must not dispatch `change`.
    const next = multiple
      ? Array.isArray(selected)
        ? selected
        : selected === undefined
          ? []
          : [selected]
      : Array.isArray(selected)
        ? selected[0]
        : selected;
    // Assign here too. On Svelte 3/4, `selected = $selectedValue` has
    // already run this pass and would not see the store write.
    selected = next;
    if (next !== $selectedValue) {
      fromProp = true;
      selectedValue.set(next);
    }
  } else if (selected !== $selectedValue) {
    fromProp = true;
    selectedValue.set(
      multiple ? (Array.isArray(selected) ? selected : []) : selected,
    );
  }
  $: {
    if (!initialRender && prevSelectedValue !== $selectedValue) {
      if (fromProp) {
        fromProp = false;
      } else {
        dispatch("change", $selectedValue);
      }
    }
    prevSelectedValue = $selectedValue;
  }
</script>

<div
  role={selection ? undefined : "table"}
  class:bx--structured-list={true}
  class:bx--structured-list--selection={selection}
  class:bx--structured-list--condensed={condensed}
  class:bx--structured-list--flush={flush}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
