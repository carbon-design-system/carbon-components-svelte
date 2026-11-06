<script>
  /**
   * Internal. One `treeitem` of a `Cascader` column, or one `option` of its
   * search results.
   * @event {null} expand
   */

  /**
   * The DOM id, which `aria-activedescendant` points at.
   * @type {string}
   */
  export let optionId;

  /** The label. */
  export let text = "";

  /**
   * `"treeitem"` in a column, `"option"` in the search results.
   * @type {"treeitem" | "option"}
   */
  export let role = "treeitem";

  /** The depth of the node: its column, from 1. */
  export let level = 1;

  /** Position among its siblings, from 1. */
  export let posInSet = 1;

  /** The number of siblings. */
  export let setSize = 1;

  /** Set to `true` when the node opens a column. */
  export let branch = false;

  /** Set to `true` when the node's column is open. */
  export let expanded = false;

  /** Set to `true` when the node is the chosen one, in single mode. */
  export let selected = false;

  /** Set to `true` to render a checkbox in the option. */
  export let checkbox = false;

  /** Whether the option is checked, in multiple mode. */
  export let checked = false;

  /** Whether the option is partly checked, in multiple mode. */
  export let indeterminate = false;

  /** Set to `true` when the cursor is on the option. */
  export let highlighted = false;

  export let disabled = false;

  /** Set to `true` to use the read-only variant. */
  export let readonly = false;

  /**
   * The state of a lazy node's children.
   * @type {undefined | "loading" | "error"}
   */
  export let loadState = undefined;

  /**
   * What to mark in the label, as offsets into `text`.
   * @type {undefined | Array<{ start: number; end: number }>}
   */
  export let ranges = undefined;

  /** Text that describes a failed load. */
  export let errorText = "";

  import { createEventDispatcher } from "svelte";
  import Highlight from "../Highlight/Highlight.svelte";
  import { ListBoxMenuItem } from "../ListBox/index.js";
  import Loading from "../Loading/Loading.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { overflowTitle } from "../utils/overflow-title.js";
  import { toAriaChecked } from "../utils/tree-aria-checked.js";

  const dispatch = createEventDispatcher();

  // Strings, not booleans: Svelte 3 and 4 write a spread `true` as a bare
  // attribute on the server.
  /** @type {"true" | "false" | undefined} */
  let ariaExpanded;
  /** @type {"true" | "false" | undefined} */
  let ariaSelected;
  $: ariaExpanded =
    role === "treeitem" && branch ? (expanded ? "true" : "false") : undefined;
  $: ariaSelected = checkbox ? undefined : selected ? "true" : "false";
  $: inTree = role === "treeitem";

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
</script>

<ListBoxMenuItem
  id={optionId}
  {role}
  aria-level={inTree ? level : undefined}
  aria-posinset={inTree ? posInSet : undefined}
  aria-setsize={inTree ? setSize : undefined}
  aria-expanded={ariaExpanded}
  aria-selected={ariaSelected}
  aria-checked={checkbox ? toAriaChecked(checked, indeterminate) : undefined}
  aria-busy={loadState === "loading" ? "true" : undefined}
  aria-labelledby="{optionId}-text"
  aria-describedby={errorText ? `${optionId}-error` : undefined}
  active={checkbox ? false : selected}
  {highlighted}
  {disabled}
  on:click
  on:mousedown
  on:mouseenter
>
  <div
    class:bx--cascader__row={true}
    class:bx--cascader__row--expanded={expanded}
  >
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
          tabindex="-1"
          style="display: none;"
          {checked}
          {indeterminate}
          {disabled}
          aria-hidden="true"
        />
        <span
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
        </span>
      </div>
    {:else}
      <span
        id="{optionId}-text"
        use:labelTitle={text}
        class:bx--cascader__label={true}
        ><span
          >{#if ranges && ranges.length > 0}<Highlight
              {text}
              {ranges}
              decorative
            />{:else}{text}{/if}</span
        ></span
      >
      {#if selected}
        <Checkmark class="bx--list-box__menu-item__selected-icon" />
      {/if}
    {/if}
    {#if branch}
      <span
        aria-hidden="true"
        class:bx--cascader__chevron={true}
        on:mousedown|preventDefault
        on:click={(event) => {
          if (checkbox && !disabled) {
            event.stopPropagation();
            dispatch("expand");
          }
        }}
      >
        {#if loadState === "loading"}
          <Loading small withOverlay={false} description="" />
        {:else if loadState === "error"}
          <WarningFilled class="bx--cascader__chevron-error" />
        {:else}
          <ChevronRight />
        {/if}
      </span>
    {/if}
  </div>
</ListBoxMenuItem>
