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
   * Specify the name of the radio group for selectable rows.
   * Only used when `selection` is `true` and `multiple` is `false`;
   * in `multiple` mode the checkboxes are not named.
   * When unset, the radios share a generated id so they form one group;
   * set a name explicitly for stable server-rendered markup.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the icon rendered in the selection column of selectable rows.
   * Only used when `selection` is `true`.
   * The icon is decorative; selection state is conveyed by each row's `aria-checked`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (CheckmarkFilled);

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { get, readonly, writable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /**
   * Coerce a selection to the mode: an array in `multiple` mode, else a
   * single value.
   * @type {(value: Value | Value[] | undefined, isMultiple: boolean) => Value | Value[] | undefined}
   */
  function toMode(value, isMultiple) {
    if (isMultiple) {
      return Array.isArray(value) ? value : value === undefined ? [] : [value];
    }
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * @type {import("svelte/store").Writable<Value | Value[] | undefined>}
   */
  const selectedValue = writable(toMode(selected, multiple));

  // Radios need a shared name to move on the arrow keys.
  const fallbackName = uniqueId("structured-list");
  const inputName = writable(
    selection && !multiple ? name || fallbackName : "",
  );
  const multipleValue = writable(multiple);
  const selectionValue = writable(selection);
  const iconValue = writable(icon);

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
   * Select the value of an input that mounts `checked`. Markup is not a
   * user choice, so this fires no `change`.
   * @type {(value: Value) => void}
   */
  function add(value) {
    const current = get(selectedValue);
    const list = Array.isArray(current) ? current : [];
    if (multiple ? list.includes(value) : current === value) return;
    // The `change` block skips the initial render without reading the flag,
    // so setting it then would swallow the next user change.
    if (!initialRender) fromProp = true;
    selectedValue.set(multiple ? [...list, value] : value);
  }

  /**
   * How many mounted inputs carry each value.
   * @type {Map<Value, number>}
   */
  const mountedValues = new Map();

  /**
   * Count an input's value. Returns a function that releases it.
   * @type {(value: Value) => () => void}
   */
  function register(value) {
    mountedValues.set(value, (mountedValues.get(value) ?? 0) + 1);
    return () => {
      const count = (mountedValues.get(value) ?? 0) - 1;
      if (count > 0) mountedValues.set(value, count);
      else mountedValues.delete(value);
      // An `{#if}` swap or re-render destroys an input before mounting its
      // replacement, so wait for the flush before deciding the value is
      // gone. Then drop a selection no input carries anymore, as the browser
      // does. Like a prop update, this fires no `change`.
      queueMicrotask(() => {
        const current = get(selectedValue);
        const list = Array.isArray(current) ? current : [];
        if (mountedValues.has(value)) return;
        if (!(multiple ? list.includes(value) : current === value)) return;
        if (!initialRender) fromProp = true;
        selectedValue.set(
          multiple ? list.filter((v) => v !== value) : undefined,
        );
      });
    };
  }

  /** @type {HTMLDivElement | null} */
  let listRef = null;

  // A form reset unchecks the row inputs without a change event. Read the
  // inputs still checked (none, unless the markup was server-rendered with
  // `checked`) back into the selection. Inputs of a nested structured list
  // are skipped. A reset fires no `change`, so mark the write like a prop
  // update.
  function handleFormReset() {
    if (!selection || !listRef) return;
    const values = Array.from(
      listRef.querySelectorAll("input.bx--structured-list-input"),
      (input) => /** @type {HTMLInputElement} */ (input),
    )
      .filter(
        (input) =>
          input.checked && input.closest(".bx--structured-list") === listRef,
      )
      .map((input) => /** @type {Value} */ (input.value));
    const next = multiple ? values : values[0];
    if (next === $selectedValue) return;
    fromProp = true;
    selectedValue.set(next);
  }

  setContext("carbon:StructuredListWrapper", {
    selectedValue,
    add,
    update,
    register,
    multiple: readonly(multipleValue),
    selection: readonly(selectionValue),
    icon: readonly(iconValue),
    inputName,
  });

  onMount(() => {
    initialRender = false;
  });

  $: inputName.set(selection && !multiple ? name || fallbackName : "");
  $: selected = $selectedValue;
  $: $multipleValue = multiple;
  $: $selectionValue = selection;
  $: $iconValue = icon;
  $: if (multiple !== prevMultiple || selected !== $selectedValue) {
    prevMultiple = multiple;
    // Coerce the value to the mode. This is a parent write, not a user
    // selection, so it must not dispatch `change`.
    const next = toMode(selected, multiple);
    // Assign here too. On Svelte 3/4, `selected = $selectedValue` has
    // already run this pass and would not see the store write.
    selected = next;
    if (next !== $selectedValue) {
      fromProp = true;
      selectedValue.set(next);
    }
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
  bind:this={listRef}
  use:formReset={handleFormReset}
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
