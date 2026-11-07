<script>
  /**
   * Internal. One `treeitem` row of a `TreeSelect` menu, shared by its plain
   * and its windowed rendering.
   * @event {null} toggle
   */

  /**
   * The row to render.
   * @type {import("./tree-select-rows.js").TreeSelectRow<any>}
   */
  export let row;

  /**
   * The DOM id of the row, which `aria-activedescendant` points at.
   * @type {string}
   */
  export let optionId;

  /** The row's label text. */
  export let text = "";

  /** Set to `true` to render a checkbox in the row. */
  export let checkbox = false;

  /** Whether the row is checked, in checkbox mode. */
  export let checked = false;

  /** Whether the row is partly checked, in checkbox mode. */
  export let indeterminate = false;

  /** Whether the row is the selected one, in single mode. */
  export let selected = false;

  /** Set to `true` to use the read-only variant. */
  export let readonly = false;

  /** Set to `true` when a search holds every ancestor open. */
  export let searching = false;

  /**
   * The state of a lazy parent's children.
   * @type {undefined | "loading" | "error"}
   */
  export let loadState = undefined;

  /**
   * Text that says a lazy parent failed to load. It describes the row and
   * shows as a tooltip on the expander's error icon.
   */
  export let errorText = "";

  /**
   * The `id` of the `TreeSelect`, which scopes the checkbox ids.
   * @type {string}
   */
  export let treeId;

  /**
   * The ordinal of the row's node, which scopes the checkbox id.
   * @type {number | undefined}
   */
  export let ordinal;

  import { createEventDispatcher } from "svelte";
  import { ListBoxMenuItem } from "../ListBox/index.js";
  import Loading from "../Loading/Loading.svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { overflowTitle } from "../utils/overflow-title.js";
  import { toAriaChecked } from "../utils/tree-aria-checked.js";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLSpanElement} */
  let toggleRef = null;

  /**
   * @param {HTMLElement} node
   * @param {string} title
   */
  function labelTitle(node, title) {
    const measure = /** @type {HTMLElement | null} */ (node.firstElementChild);
    const action = overflowTitle(node, { title, measure });
    return {
      update: (/** @type {string} */ next) =>
        action.update({ title: next, measure }),
      destroy: action.destroy,
    };
  }

  $: disabled = Boolean(row.node.disabled);
  $: checkboxId = `checkbox-${treeId}-${ordinal}`;
  $: toggleLocked = searching && row.expanded;
  // Literal strings, not booleans: Svelte 3 and 4 write a spread `true` as a
  // bare attribute on the server.
  /** @type {"true" | "false" | undefined} */
  let ariaExpanded;
  /** @type {"true" | "false" | undefined} */
  let ariaSelected;
  $: ariaExpanded = row.expandable
    ? row.expanded
      ? "true"
      : "false"
    : undefined;
  $: ariaSelected = checkbox ? undefined : selected ? "true" : "false";
</script>

<ListBoxMenuItem
  id={optionId}
  role="treeitem"
  aria-level={row.depth + 1}
  aria-setsize={row.setSize}
  aria-posinset={row.posInSet}
  aria-expanded={ariaExpanded}
  aria-selected={ariaSelected}
  aria-checked={checkbox ? toAriaChecked(checked, indeterminate) : undefined}
  aria-busy={loadState === "loading" ? "true" : undefined}
  aria-labelledby="{optionId}-text"
  aria-describedby={errorText ? `${optionId}-error` : undefined}
  active={checkbox ? false : selected}
  {disabled}
  style="--ccs-tree-select-depth: {row.depth};"
  on:click
  on:mousedown
  on:mouseenter
>
  <div class:bx--tree-select__row={true}>
    {#if row.expandable}
      <!-- Pointer-only: a keyboard user expands with the arrow keys, from
           the field, so the toggle stays out of the tab order and the tree. -->
      <span
        bind:this={toggleRef}
        aria-hidden="true"
        class:bx--tree-select__toggle={true}
        class:bx--tree-select__toggle--expanded={row.expanded}
        class:bx--tree-select__toggle--locked={toggleLocked}
        on:mousedown|preventDefault
        on:click|preventDefault|stopPropagation={() => {
          if (!disabled && !toggleLocked) dispatch("toggle");
        }}
      >
        {#if loadState === "loading"}
          <Loading small withOverlay={false} description="" />
        {:else if loadState === "error"}
          <WarningFilled class="bx--tree-select__toggle-error" />
          <AnchoredTooltip
            anchor={toggleRef}
            text={errorText}
            enabled={errorText !== ""}
            align="start"
            dismissOnClick={false}
          />
        {:else}
          <ChevronRight />
        {/if}
      </span>
    {:else}
      <span aria-hidden="true" class:bx--tree-select__toggle={true}></span>
    {/if}
    {#if errorText}
      <span id="{optionId}-error" class:bx--visually-hidden={true}
        >{errorText}</span
      >
    {/if}
    {#if checkbox}
      <div
        class:bx--form-item={true}
        class:bx--checkbox-wrapper={true}
        class:bx--checkbox-wrapper--readonly={readonly}
      >
        <input
          type="checkbox"
          class:bx--checkbox={true}
          id={checkboxId}
          tabindex="-1"
          style="display: none;"
          {checked}
          {indeterminate}
          {disabled}
          aria-readonly={readonly || undefined}
        />
        <label
          for={checkboxId}
          use:labelTitle={text}
          data-contained-checkbox-state={indeterminate ? "mixed" : undefined}
          data-contained-checkbox-disabled={indeterminate && disabled
            ? "true"
            : undefined}
          class:bx--checkbox-label={true}
        >
          <span id="{optionId}-text" class:bx--checkbox-label-text={true}
            >{text}</span
          >
        </label>
      </div>
    {:else}
      <span
        id="{optionId}-text"
        use:labelTitle={text}
        class:bx--tree-select__label={true}><span>{text}</span></span
      >
      {#if selected}
        <Checkmark class="bx--list-box__menu-item__selected-icon" />
      {/if}
    {/if}
  </div>
</ListBoxMenuItem>
