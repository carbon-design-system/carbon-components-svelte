<script>
  /**
   * @template [Item=any]
   * @restProps {fieldset}
   * @event {{ index: number; item: Item }} add - Cancelable. Dispatched before an item is added; call `preventDefault()` to keep it out.
   * @event {{ index: number; item: Item }} remove - Cancelable. Dispatched before an item is removed; call `preventDefault()` to keep it, such as to ask first.
   * @event {{ from: number; to: number; item: Item }} move - Dispatched after an item is moved.
   * @event {Item[]} change - Dispatched after items are added, removed or moved.
   * @slot {{ item: Item; index: number; number: number; count: number; id: string; fieldName: string | undefined; label: string; remove: () => void; moveUp: () => void; moveDown: () => void; }} - The fields of one item. `id` is the item's DOM id (`{id}-{index}`) and `fieldName` its form name prefix (`{name}[{index}]`).
   * @slot {{}} empty - Shown in place of the list while it has no items.
   */

  /**
   * Specify the items. The app owns them: the component replaces the array
   * on every add, remove and move, and never changes an item.
   * @type {Item[]}
   * @bindable writable
   */
  export let items = [];

  /**
   * Specify the singular noun for one item, such as `"email"`. It builds
   * the default texts: "Add another email", "Remove email 2".
   */
  export let itemName = "item";

  /**
   * Make a new item for the Add button, and to fill the list up to `min`.
   * @type {(index: number) => Item}
   */
  export let createItem = defaultCreateItem;

  /**
   * Set the fewest items. The list is filled up to it with `createItem`,
   * and Remove is disabled at it.
   */
  export let min = 0;

  /**
   * Set the most items. Add is disabled at it.
   * @type {number}
   */
  export let max = Infinity;

  /**
   * Set to `true` to show Move up and Move down buttons on each item.
   * Both stay focusable at the ends of the list, so a key press that
   * moves an item to the end does not lose focus.
   */
  export let reorderable = false;

  /**
   * Specify a key for an item, such as its database id. Set it when the
   * app sorts or replaces `items` itself, so rows keep their fields (and
   * focus) with their items. Without it, a row is identified by where the
   * component put it.
   * @type {((item: Item, index: number) => string | number) | undefined}
   */
  export let itemKey = undefined;

  /**
   * Set a form name for the items. The slot gets `fieldName` as `{name}[{index}]`,
   * for a field to post as `emails[0]`, or `members[0][role]` with a suffix.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Set an id for the group. The item id (`{id}-{index}`) and the ids of
   * the status and limit text derive from it.
   */
  export let id = uniqueId();

  /** Specify the legend text of the group */
  export let legendText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to disable the group, its fields and its buttons */
  export let disabled = false;

  /**
   * Set to `true` to hide each item's label visually. The label remains
   * available to screen readers as the name of the item's group. Do this
   * when a field in the item shows the same label.
   */
  export let hideItemLabel = false;

  /**
   * Specify a function that returns a one-line summary of an item. When
   * set, items collapse to their summary with an Edit button, and a new
   * item opens for editing. Collapsed fields stay in the page, so a form
   * still posts them.
   * @type {((item: Item, index: number) => string) | undefined}
   */
  export let summaryText = undefined;

  /** Specify the text of the Add button. Defaults to "Add another {itemName}". */
  export let addText = "";

  /**
   * Specify the text shown in place of the list while it is empty.
   * Alternatively, use the named slot "empty".
   */
  export let emptyText = "Nothing added yet";

  /**
   * Build the label of an item, which names its group.
   * @type {(itemName: string, number: number) => string}
   */
  export let itemLabelText = defaultItemLabelText;

  /**
   * Build the accessible name of an item's Remove button.
   * @type {(itemName: string, number: number) => string}
   */
  export let removeText = defaultRemoveText;

  /**
   * Build the accessible name of an item's Move up button.
   * @type {(itemName: string, number: number) => string}
   */
  export let moveUpText = defaultMoveUpText;

  /**
   * Build the accessible name of an item's Move down button.
   * @type {(itemName: string, number: number) => string}
   */
  export let moveDownText = defaultMoveDownText;

  /**
   * Build the accessible name of an item's Edit button in summary mode.
   * @type {(itemName: string, number: number) => string}
   */
  export let editText = defaultEditText;

  /**
   * Build the announcement after an item is added.
   * @type {(itemName: string, number: number) => string}
   */
  export let addedText = defaultAddedText;

  /**
   * Build the announcement after an item is removed. `number` is the
   * number it had.
   * @type {(itemName: string, number: number) => string}
   */
  export let removedText = defaultRemovedText;

  /**
   * Build the announcement after an item is moved. `from` and `to` are
   * numbers, from 1.
   * @type {(itemName: string, from: number, to: number, count: number) => string}
   */
  export let movedText = defaultMovedText;

  /**
   * Build the message shown, and announced, when `max` is reached.
   * @type {(max: number) => string}
   */
  export let maxText = defaultMaxText;

  /**
   * Build the message shown, and announced, when the last removable item
   * is removed and `min` is reached.
   * @type {(min: number) => string}
   */
  export let minText = defaultMinText;

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import FormGroup from "../FormGroup/FormGroup.svelte";
  import FormHelperText from "../FormHelperText/FormHelperText.svelte";
  import Add from "../icons/Add.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Close from "../icons/Close.svelte";
  import Edit from "../icons/Edit.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { focusQuietly } from "../utils/focus.js";
  import { selectorTabbable } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { createKeyer, moveInArray, padItems } from "./field-repeater.js";

  /** @returns {any} */
  function defaultCreateItem() {
    return "";
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultItemLabelText(itemName, number) {
    return `${itemName.charAt(0).toLocaleUpperCase()}${itemName.slice(1)} ${number}`;
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultRemoveText(itemName, number) {
    return `Remove ${itemName} ${number}`;
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultMoveUpText(itemName, number) {
    return `Move ${itemName} ${number} up`;
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultMoveDownText(itemName, number) {
    return `Move ${itemName} ${number} down`;
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultEditText(itemName, number) {
    return `Edit ${itemName} ${number}`;
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultAddedText(itemName, number) {
    return defaultItemLabelText(itemName, number) + " added";
  }

  /**
   * @param {string} itemName
   * @param {number} number
   */
  function defaultRemovedText(itemName, number) {
    return defaultItemLabelText(itemName, number) + " removed";
  }

  /**
   * @param {string} itemName
   * @param {number} from
   * @param {number} to
   * @param {number} count
   */
  function defaultMovedText(itemName, from, to, count) {
    return `${defaultItemLabelText(itemName, from)} moved to position ${to} of ${count}`;
  }

  /** @param {number} max */
  function defaultMaxText(max) {
    return `Maximum of ${max} reached`;
  }

  /** @param {number} min */
  function defaultMinText(min) {
    return `Minimum of ${min} reached`;
  }

  const dispatch = createEventDispatcher();
  const keyer = createKeyer();

  /** @type {null | HTMLUListElement} */
  let listRef = null;
  /** @type {null | HTMLAnchorElement | HTMLButtonElement} */
  let addRef = null;
  /** The text of the live region. */
  let liveText = "";
  let liveFlip = false;
  /** Whether the last removal reached `min`; cleared by an add. */
  let minReached = false;
  /** @type {Record<string, true>} */
  let expanded = {};
  /**
   * The item whose Remove button is being pressed.
   * @type {HTMLElement | null}
   */
  let pressed = null;

  // The list is never shorter than `min`. Guarded, so an equal assignment
  // never loops through `bind:items`.
  $: if (items.length < min) items = padItems(items, min, createItem);
  $: keys = keyer.sync(items, itemKey);
  $: count = items.length;
  $: atMax = count >= max;
  $: atMin = count <= min;
  $: showMin = minReached && atMin && min > 0 && !atMax;
  $: limitId = `${id}-limit`;
  $: limitMessage =
    atMax && Number.isFinite(max) ? maxText(max) : showMin ? minText(min) : "";
  $: summarized = typeof summaryText === "function";
  $: addLabel = addText || `Add another ${itemName}`;

  /** @param {string} text */
  function announce(text) {
    // Alternate a trailing no-break space so that the same message twice in
    // a row (two removals) still changes the region and is read again.
    liveFlip = !liveFlip;
    liveText = liveFlip ? text : `${text} `;
  }

  /** @param {number} index */
  function itemNode(index) {
    return /** @type {HTMLElement | null} */ (listRef?.children[index] ?? null);
  }

  /**
   * Focus the first field of item `index`, or the item's group when it has
   * no focusable field. In summary mode the item opens first.
   * @param {number} index
   * @returns {Promise<boolean>} Whether focus moved.
   */
  export async function focusItem(index) {
    const at = Math.max(0, Math.min(index, items.length - 1));
    if (!items.length) return false;
    if (summarized && !expanded[keys[at]]) {
      expanded = { ...expanded, [keys[at]]: true };
      await tick();
    }
    const node = itemNode(at);
    const target =
      node
        ?.querySelector(".bx--field-repeater__fields")
        ?.querySelector(selectorTabbable) ??
      node?.querySelector('[role="group"]');
    if (!(target instanceof HTMLElement)) return false;
    focusQuietly(target);
    return true;
  }

  /**
   * Add a new item at the end and focus its first field.
   * @returns {Promise<boolean>} Whether an item was added.
   */
  export async function add() {
    if (disabled || atMax) return false;
    const index = items.length;
    const item = createItem(index);
    if (!dispatch("add", { index, item }, { cancelable: true })) return false;
    keyer.insert(index);
    items = [...items, item];
    minReached = false;
    if (summarized)
      expanded = { ...expanded, [keyer.sync(items, itemKey)[index]]: true };
    announce(
      [
        addedText(itemName, index + 1),
        items.length >= max && Number.isFinite(max) ? maxText(max) : "",
      ]
        .filter(Boolean)
        .join(". "),
    );
    dispatch("change", items);
    await tick();
    focusItem(index);
    return true;
  }

  /**
   * Remove the item at `index`. Focus moves to the next item's first field,
   * else the previous item's, else the Add button.
   * @param {number} index
   * @returns {Promise<boolean>} Whether an item was removed.
   */
  export async function removeAt(index) {
    if (disabled || index < 0 || index >= items.length || atMin) return false;
    const item = items[index];
    if (!dispatch("remove", { index, item }, { cancelable: true }))
      return false;
    const node = itemNode(index);
    // Only move focus that was in the item. A click on Remove counts even
    // where the browser does not focus a clicked button (Safari).
    const hadFocus =
      !!node && (node.contains(document.activeElement) || pressed === node);
    const removedKey = keys[index];
    keyer.remove(index);
    items = items.filter((_, i) => i !== index);
    if (removedKey in expanded) {
      const { [removedKey]: _, ...rest } = expanded;
      expanded = rest;
    }
    minReached = items.length <= min && min > 0;
    announce(
      [removedText(itemName, index + 1), minReached ? minText(min) : ""]
        .filter(Boolean)
        .join(". "),
    );
    dispatch("change", items);
    if (hadFocus) {
      await tick();
      if (items.length) await focusItem(Math.min(index, items.length - 1));
      else if (addRef) focusQuietly(addRef);
    }
    return true;
  }

  /**
   * Move the item at `from` to `to`, and keep focus on the control that
   * moved it.
   * @param {number} from
   * @param {number} to
   * @param {"up" | "down" | undefined} [control]
   * @returns {Promise<boolean>} Whether an item moved.
   */
  export async function move(from, to, control) {
    if (disabled || from === to) return false;
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return false;
    }
    const item = items[from];
    keyer.move(from, to);
    items = moveInArray(items, from, to);
    announce(movedText(itemName, from + 1, to + 1, items.length));
    dispatch("move", { from, to, item });
    dispatch("change", items);
    // A browser drops focus from a node a keyed list moves.
    await tick();
    const target = control
      ? itemNode(to)?.querySelector(`[data-field-repeater-action="${control}"]`)
      : null;
    if (target instanceof HTMLElement) focusQuietly(target);
    else if (control === undefined) focusItem(to);
    return true;
  }

  /** @param {number} index */
  function handleRemoveClick(index) {
    pressed = itemNode(index);
    removeAt(index);
    pressed = null;
  }

  /** @param {string} key */
  function toggleExpanded(key) {
    if (expanded[key]) {
      const { [key]: _, ...rest } = expanded;
      expanded = rest;
    } else {
      expanded = { ...expanded, [key]: true };
    }
  }

  /**
   * @param {string} key
   * @param {number} index
   */
  async function handleEditClick(key, index) {
    const opening = !expanded[key];
    toggleExpanded(key);
    if (opening) {
      await tick();
      focusItem(index);
    }
  }
</script>

<FormGroup
  {id}
  {legendText}
  {disabled}
  {invalid}
  message={Boolean(invalidText)}
  messageText={invalidText}
  {...$$restProps}
  class={["bx--field-repeater", $$restProps.class].filter(Boolean).join(" ")}
  aria-describedby={joinDescribedBy(
    limitMessage ? limitId : undefined,
    $$restProps["aria-describedby"],
  )}
>
  {#if helperText}
    <FormHelperText>{helperText}</FormHelperText>
  {/if}
  {#if count}
    <ul
      bind:this={listRef}
      class:bx--field-repeater__list={true}
      class:bx--field-repeater__list--hidden-label={hideItemLabel}
      class:bx--field-repeater__list--summary={summarized}
    >
      {#each keys as key, index (key)}
        {@const number = index + 1}
        {@const label = itemLabelText(itemName, number)}
        {@const itemId = `${id}-${index}`}
        {@const open = !summarized || expanded[key]}
        <li class:bx--field-repeater__item={true}>
          <div
            role="group"
            tabindex="-1"
            id={itemId}
            aria-labelledby="{itemId}-label"
            class:bx--field-repeater__group={true}
          >
            <div class:bx--field-repeater__main={true}>
              <span
                id="{itemId}-label"
                class:bx--label={true}
                class:bx--field-repeater__label={true}
                class:bx--visually-hidden={hideItemLabel}>{label}</span
              >
              {#if summarized && !open}
                <p class:bx--field-repeater__summary={true}>
                  {summaryText?.(items[index], index)}
                </p>
              {/if}
              <div
                id="{itemId}-fields"
                class:bx--field-repeater__fields={true}
                hidden={!open}
              >
                <slot
                  item={items[index]}
                  {index}
                  {number}
                  {count}
                  id={itemId}
                  fieldName={name ? `${name}[${index}]` : undefined}
                  {label}
                  remove={() => removeAt(index)}
                  moveUp={() => move(index, index - 1, "up")}
                  moveDown={() => move(index, index + 1, "down")}
                />
              </div>
            </div>
            <div class:bx--field-repeater__actions={true}>
              {#if summarized}
                <Button
                  kind="ghost"
                  size="field"
                  icon={Edit}
                  iconDescription={editText(itemName, number)}
                  tooltipAlign="top"
                  aria-expanded={open ? "true" : "false"}
                  aria-controls="{itemId}-fields"
                  data-field-repeater-action="edit"
                  on:click={() => handleEditClick(key, index)}
                />
              {/if}
              {#if reorderable}
                <Button
                  kind="ghost"
                  size="field"
                  icon={ArrowUp}
                  iconDescription={moveUpText(itemName, number)}
                  tooltipAlign="top"
                  aria-disabled={index === 0 ? "true" : undefined}
                  class={index === 0 ? "bx--btn--disabled" : undefined}
                  data-field-repeater-action="up"
                  on:click={() => move(index, index - 1, "up")}
                />
                <Button
                  kind="ghost"
                  size="field"
                  icon={ArrowDown}
                  iconDescription={moveDownText(itemName, number)}
                  tooltipAlign="top"
                  aria-disabled={index === count - 1 ? "true" : undefined}
                  class={index === count - 1 ? "bx--btn--disabled" : undefined}
                  data-field-repeater-action="down"
                  on:click={() => move(index, index + 1, "down")}
                />
              {/if}
              <Button
                kind="ghost"
                size="field"
                icon={Close}
                iconDescription={removeText(itemName, number)}
                tooltipAlign="top"
                disabled={atMin}
                data-field-repeater-action="remove"
                on:click={() => handleRemoveClick(index)}
              />
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <div class:bx--field-repeater__empty={true}>
      <slot name="empty">{emptyText}</slot>
    </div>
  {/if}
  <div class:bx--field-repeater__footer={true}>
    <Button
      bind:ref={addRef}
      kind="tertiary"
      size="field"
      icon={Add}
      disabled={atMax}
      on:click={add}>{addLabel}</Button
    >
    {#if limitMessage}
      <div id={limitId} class:bx--form__helper-text={true}>{limitMessage}</div>
    {/if}
  </div>
  <div
    id="{id}-status"
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {liveText}
  </div>
</FormGroup>
