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

  import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";
  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<Value | Value[] | undefined>}
   */
  const selectedValue = writable(
    multiple ? (Array.isArray(selected) ? selected : []) : selected,
  );

  let prevSelectedValue = $selectedValue;
  let isInitialRender = true;

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

  setContext("carbon:StructuredListWrapper", {
    selectedValue,
    update,
    multiple,
    selection,
    icon,
  });

  onMount(() => {
    isInitialRender = false;
  });

  $: selected = $selectedValue;
  $: {
    if (!isInitialRender && prevSelectedValue !== $selectedValue) {
      dispatch("change", $selectedValue);
    }
    prevSelectedValue = $selectedValue;
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  role="table"
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
