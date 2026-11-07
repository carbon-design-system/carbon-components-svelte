<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   * @restProps {button}
   */

  /**
   * @typedef {object} ToolbarSortByTexts
   * @property {string} heading - The dialog heading
   * @property {string} firstRule - The label of the first rule's column field
   * @property {string} nextRule - The label of every later rule's column field
   * @property {string} rule - The name of a rule's group; `{n}` is its position
   * @property {string} direction - The label of a rule's direction field
   * @property {string} ascending
   * @property {string} descending
   * @property {string} moveUp
   * @property {string} moveDown
   * @property {string} remove
   * @property {string} addRule
   * @property {string} empty - Shown while there are no rules
   * @property {string} apply
   * @property {string} cancel
   */

  /**
   * Specify the trigger's accessible label.
   */
  export let labelText = "Sort by";

  /**
   * Override the dialog's text. Keys you leave out keep their defaults.
   * @type {Partial<ToolbarSortByTexts>}
   */
  export let texts = {};

  /**
   * Set to `true` to open the dialog.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the trigger HTML element.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Modal from "../Modal/Modal.svelte";
  import Portal from "../Portal/Portal.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import Add from "../icons/Add.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";
  import Close from "../icons/Close.svelte";
  import { sortListsEqual } from "./data-table-utils.js";

  const DEFAULT_TEXTS = {
    heading: "Sort by",
    firstRule: "Sort by",
    nextRule: "Then by",
    rule: "Sort rule {n}",
    direction: "Order",
    ascending: "Ascending",
    descending: "Descending",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    addRule: "Add sort rule",
    empty: "The table is not sorted.",
    apply: "Apply",
    cancel: "Cancel",
  };

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:DataTable");
  /**
   * @type {import("svelte/store").Readable<{ mode: "single" | "multiple"; list: ReadonlyArray<{ key: string; direction: "ascending" | "descending" }>; columns: ReadonlyArray<{ key: string; value?: unknown }> }> | undefined}
   */
  const sortState = ctx?.sortState;
  const applySort = ctx?.applySort;

  /** @type {null | HTMLDivElement} */
  let rulesRef = null;
  /** @type {null | HTMLButtonElement} */
  let addRef = null;
  let uid = 0;
  /** @type {Array<{ uid: number; key: string; direction: "ascending" | "descending" }>} */
  let draft = [];
  let wasOpen = false;
  // The dialog is built on the first open, and kept.
  let openedOnce = open;

  $: t = { ...DEFAULT_TEXTS, ...texts };
  $: mode = $sortState?.mode ?? "single";
  $: list = $sortState?.list ?? [];
  $: columns = $sortState?.columns ?? [];
  $: maxRules =
    mode === "multiple" ? columns.length : Math.min(1, columns.length);
  $: usedKeys = new Set(draft.map((rule) => rule.key));
  $: canAdd = draft.length < maxRules;

  $: if (open !== wasOpen) {
    wasOpen = open;
    if (open) {
      openedOnce = true;
      draft = list.map((rule) => ({ ...rule, uid: ++uid }));
      focusFirstField();
    }
  }

  // The modal focuses its first field as it opens, but a <select> made in
  // that same update refuses focus in WebKit, so the focus stays on the
  // trigger behind the dialog. Ask again once the frame has painted.
  async function focusFirstField() {
    // Nothing to focus on the server.
    if (typeof requestAnimationFrame === "undefined") return;
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const field = rulesRef?.querySelector("select");
    if (open && field && !rulesRef?.contains(document.activeElement)) {
      field.focus();
    }
  }

  /** @param {{ key: string; value?: unknown }} column */
  function columnLabel(column) {
    return String(column.value ?? column.key);
  }

  /**
   * Move focus to a control in a rule, or to the add button when there is no rule.
   * @param {number} index
   * @param {string} selector
   */
  async function focusRule(index, selector) {
    await tick();
    const rules = rulesRef?.querySelectorAll("[data-sort-rule]");
    const target =
      rules?.[Math.min(index, rules.length - 1)]?.querySelector(selector);
    /** @type {HTMLElement | null | undefined} */ (target ?? addRef)?.focus();
  }

  function addRule() {
    const column = columns.find((c) => !usedKeys.has(c.key));
    if (!column || !canAdd) return;
    draft = [...draft, { uid: ++uid, key: column.key, direction: "ascending" }];
    focusRule(draft.length - 1, "select");
  }

  /** @param {number} index */
  function removeRule(index) {
    draft = draft.filter((_, i) => i !== index);
    focusRule(index, "select");
  }

  /**
   * @param {number} index
   * @param {-1 | 1} offset
   */
  function moveRule(index, offset) {
    const next = [...draft];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    draft = next;
    // The button that was pressed moved with the rule; keep focus on it. At
    // the end of the list it is disabled and cannot hold focus, so take the
    // button that moves the rule back.
    const target = index + offset;
    const movedUp = offset < 0;
    const atEnd = movedUp ? target === 0 : target === next.length - 1;
    const sameDirection = movedUp ? !atEnd : atEnd;
    focusRule(target, sameDirection ? "[data-move-up]" : "[data-move-down]");
  }

  /**
   * @param {number} index
   * @param {Partial<{ key: string; direction: "ascending" | "descending" }>} patch
   */
  function updateRule(index, patch) {
    draft = draft.map((rule, i) =>
      i === index ? { ...rule, ...patch } : rule,
    );
  }

  function apply() {
    const next = draft.map(({ key, direction }) => ({ key, direction }));
    open = false;
    if (sortListsEqual(next, list)) return;
    applySort?.(next);
    dispatch("apply", { sortBy: next });
  }
</script>

<Button
  bind:ref
  kind="ghost"
  iconOnly
  icon={ArrowsVertical}
  iconDescription={labelText}
  tooltipPosition="bottom"
  tooltipAlignment="end"
  aria-haspopup="dialog"
  disabled={columns.length === 0}
  {...$$restProps}
  class={["bx--toolbar-action", $$restProps.class].filter(Boolean).join(" ")}
  on:click={() => {
    open = !open;
  }}
/>

{#if openedOnce}
  <Portal>
    <Modal
      bind:open
      lazy
      size="sm"
      hasForm
      shouldSubmitOnEnter={false}
      modalHeading={t.heading}
      primaryButtonText={t.apply}
      secondaryButtonText={t.cancel}
      on:submit={apply}
      on:click:button--secondary={() => {
        open = false;
      }}
    >
      <div class:bx--sort-by={true} bind:this={rulesRef}>
        {#if draft.length === 0}
          <p class:bx--sort-by__empty={true}>{t.empty}</p>
        {/if}
        {#each draft as rule, index (rule.uid)}
          <div
            role="group"
            aria-label={t.rule.replace("{n}", String(index + 1))}
            class:bx--sort-by__rule={true}
            data-sort-rule
          >
            <div class:bx--sort-by__field={true}>
              <Select
                size="md"
                selected={rule.key}
                labelText={index === 0 ? t.firstRule : t.nextRule}
                on:update={(event) => updateRule(index, { key: event.detail })}
              >
                {#each columns as column (column.key)}
                  {#if column.key === rule.key || !usedKeys.has(column.key)}
                    <SelectItem value={column.key} text={columnLabel(column)} />
                  {/if}
                {/each}
              </Select>
            </div>
            <div
              class:bx--sort-by__field={true}
              class:bx--sort-by__field--direction={true}
            >
              <Select
                size="md"
                hideLabel
                selected={rule.direction}
                labelText={t.direction}
                on:update={(event) =>
                  updateRule(index, { direction: event.detail })}
              >
                <SelectItem value="ascending" text={t.ascending} />
                <SelectItem value="descending" text={t.descending} />
              </Select>
            </div>
            {#if mode === "multiple"}
              <Button
                kind="ghost"
                size="field"
                iconOnly
                icon={ArrowUp}
                iconDescription={t.moveUp}
                tooltipPosition="top"
                disabled={index === 0}
                data-move-up
                on:click={() => moveRule(index, -1)}
              />
              <Button
                kind="ghost"
                size="field"
                iconOnly
                icon={ArrowDown}
                iconDescription={t.moveDown}
                tooltipPosition="top"
                disabled={index === draft.length - 1}
                data-move-down
                on:click={() => moveRule(index, 1)}
              />
            {/if}
            <Button
              kind="ghost"
              size="field"
              iconOnly
              icon={Close}
              iconDescription={t.remove}
              tooltipPosition="top"
              tooltipAlignment="end"
              on:click={() => removeRule(index)}
            />
          </div>
        {/each}
        {#if maxRules > 1 || draft.length === 0}
          <Button
            bind:ref={addRef}
            kind="tertiary"
            size="field"
            icon={Add}
            disabled={!canAdd}
            on:click={addRule}>{t.addRule}</Button
          >
        {/if}
      </div>
    </Modal>
  </Portal>
{/if}
