<script>
  /**
   * Renders one node of the form: a field, a group or an array.
   * Internal to `SchemaForm`.
   */

  /** The path of the node, like `addresses.0.city`. */
  export let path = "";

  /** @type {import("./field-config.js").FieldNode} */
  export let node;

  /**
   * Set to `true` for a group that is an array row. Its fields render
   * without a fieldset of their own.
   */
  export let bare = false;

  /** The label of an array row, which names a field that has none of its own. */
  export let rowTitle = "";

  import { getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import FormGroup from "../FormGroup/FormGroup.svelte";
  import FormHelperText from "../FormHelperText/FormHelperText.svelte";
  import { CssColumn, CssGrid } from "../Grid/index.js";
  import Add from "../icons/Add.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import { SCHEMA_FORM_CONTEXT_KEY } from "./context.js";
  import { joinPath, pathToId, pathToName } from "./form-path.js";

  /** @type {import("./context.js").SchemaFormContext} */
  const { form, widgets, labels, optionalMark, announce } = getContext(
    SCHEMA_FORM_CONTEXT_KEY,
  );

  $: store = form.field(path);
  $: state = $store;
  $: rowStore = node.kind === "array" ? form.rows(path) : undefined;
  /** @type {string[]} */
  let ids = [];
  $: ids = rowStore ? ($rowStore ?? []) : [];
  $: id = pathToId(form.id, path);
  $: config = node.config;
  $: label = withOptionalMark(node.label || rowTitle, state.required);
  $: Widget =
    node.kind === "field" ? (widgets[node.type] ?? widgets.text) : null;
  $: columns = Math.min(Math.max(config.columns ?? 1, 1), 4);

  /**
   * @param {string} text
   * @param {boolean} required
   */
  function withOptionalMark(text, required) {
    if (
      optionalMark &&
      !required &&
      node.kind === "field" &&
      node.type !== "checkbox" &&
      node.type !== "toggle"
    ) {
      return `${text} ${labels.optional}`;
    }
    return text;
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    if (!target.contains(/** @type {Node | null} */ (event.relatedTarget))) {
      form.blur(path);
    }
  }

  /** @type {HTMLElement | undefined} */
  let rowsEl;

  /**
   * Focus the first enabled control of a row that matches one of the
   * selectors, in order.
   * @param {string[]} selectors
   * @param {number} index
   */
  async function focusRow(selectors, index) {
    await tick();
    const rows = rowsEl?.querySelectorAll(":scope > .bx--schema-form__row");
    const row = rows?.[Math.min(index, rows.length - 1)];
    for (const selector of selectors) {
      /** @type {HTMLButtonElement | null | undefined} */
      const target = row?.querySelector(selector);
      if (target && !target.disabled) {
        target.focus();
        return;
      }
    }
  }

  /** @param {number} index */
  function rowLabel(index) {
    const { itemLabel } = config;
    if (typeof itemLabel === "function") return itemLabel(index + 1);
    if (typeof itemLabel === "string") return `${itemLabel} ${index + 1}`;
    return labels.row(index + 1);
  }

  async function addRow() {
    const index = form.add(path);
    if (index < 0) return;
    announce(labels.added(rowLabel(index), ids.length + 1));
    await tick();
    const rows = rowsEl?.querySelectorAll(":scope > .bx--schema-form__row");
    /** @type {HTMLElement | null | undefined} */
    const control = rows?.[index]?.querySelector(
      "input:not([type=hidden]), select, textarea, button[role=combobox]",
    );
    control?.focus();
  }

  /** @param {number} index */
  async function removeRow(index) {
    announce(labels.removed(rowLabel(index), ids.length - 1));
    form.remove(path, index);
    if (ids.length === 1) {
      await tick();
      addButton?.focus();
    } else {
      focusRow(["[data-action=remove]"], index);
    }
  }

  /**
   * @param {number} from
   * @param {number} to
   */
  function moveRow(from, to) {
    form.move(path, from, to);
    announce(labels.moved(rowLabel(from), to + 1, ids.length));
    const [same, other] = to > from ? ["down", "up"] : ["up", "down"];
    focusRow([`[data-action=${same}]`, `[data-action=${other}]`], to);
  }

  /** @type {HTMLButtonElement | null} */
  let addButton = null;

  /**
   * @param {import("./field-config.js").FieldNode} child
   * @param {number} gridColumns
   */
  function span(child, gridColumns) {
    const columnsSpanned = Math.min(child.config.span ?? 1, gridColumns);
    const size = 16 / gridColumns;
    return {
      sm: 4,
      md: gridColumns === 1 ? 8 : Math.min(8, columnsSpanned * 4),
      lg: size * columnsSpanned,
    };
  }
</script>

{#if state.visible}
  {#if node.kind === "field" && Widget}
    <div
      class="bx--schema-form__field"
      data-schema-path={path}
      on:focusout={onFocusOut}
    >
      <svelte:component
        this={Widget}
        {id}
        name={pathToName(path)}
        {label}
        value={state.value}
        field={node}
        helperText={config.helperText ?? ""}
        placeholder={config.placeholder ?? ""}
        invalid={!!state.error}
        invalidText={state.error ?? ""}
        warn={!!state.warn && !state.error}
        warnText={state.warn ?? ""}
        disabled={state.disabled}
        readonly={state.readonly}
        required={state.required}
        on:change={(event) => form.setValue(path, event.detail)}
      />
    </div>
  {:else if node.kind === "group"}
    {#if path === "" || bare}
      {#if columns > 1}
        <CssGrid fullWidth narrow withRowGap>
          {#each node.children as child (child.name)}
            <CssColumn {...span(child, columns)}>
              <svelte:self path={joinPath(path, child.name)} node={child} />
            </CssColumn>
          {/each}
        </CssGrid>
      {:else}
        {#each node.children as child (child.name)}
          <svelte:self path={joinPath(path, child.name)} node={child} />
        {/each}
      {/if}
    {:else}
      <FormGroup
        {id}
        legendText={label}
        disabled={state.disabled}
        invalid={!!state.error}
        message={!!state.error}
        messageText={state.error ?? ""}
      >
        {#if config.helperText}
          <FormHelperText>{config.helperText}</FormHelperText>
        {/if}
        {#if columns > 1}
          <CssGrid fullWidth narrow withRowGap>
            {#each node.children as child (child.name)}
              <CssColumn {...span(child, columns)}>
                <svelte:self path={joinPath(path, child.name)} node={child} />
              </CssColumn>
            {/each}
          </CssGrid>
        {:else}
          {#each node.children as child (child.name)}
            <svelte:self path={joinPath(path, child.name)} node={child} />
          {/each}
        {/if}
      </FormGroup>
    {/if}
  {:else if node.kind === "array" && node.item}
    <FormGroup
      {id}
      legendText={label}
      disabled={state.disabled}
      invalid={!!state.error}
      message={!!state.error}
      messageText={state.error ?? ""}
    >
      {#if config.helperText}
        <FormHelperText>{config.helperText}</FormHelperText>
      {/if}
      <div bind:this={rowsEl} class="bx--schema-form__rows">
        {#each ids as rowId, index (rowId)}
          <div
            class="bx--schema-form__row"
            role="group"
            aria-labelledby={node.item.kind === "field"
              ? undefined
              : `${id}-${rowId}-label`}
            aria-label={node.item.kind === "field"
              ? rowLabel(index)
              : undefined}
          >
            <div class="bx--schema-form__row-header">
              {#if node.item.kind === "field"}
                <span></span>
              {:else}
                <span class="bx--label" id="{id}-{rowId}-label"
                  >{rowLabel(index)}</span
                >
              {/if}
              <div class="bx--schema-form__row-actions">
                <Button
                  kind="ghost"
                  size="sm"
                  icon={ArrowUp}
                  iconDescription="{labels.moveUp} ({rowLabel(index)})"
                  tooltipPosition="top"
                  disabled={index === 0 || state.disabled}
                  data-action="up"
                  on:click={() => moveRow(index, index - 1)}
                />
                <Button
                  kind="ghost"
                  size="sm"
                  icon={ArrowDown}
                  iconDescription="{labels.moveDown} ({rowLabel(index)})"
                  tooltipPosition="top"
                  disabled={index === ids.length - 1 || state.disabled}
                  data-action="down"
                  on:click={() => moveRow(index, index + 1)}
                />
                <Button
                  kind="ghost"
                  size="sm"
                  disabled={state.disabled}
                  aria-label="{labels.remove} {rowLabel(index)}"
                  data-action="remove"
                  on:click={() => removeRow(index)}
                >
                  {labels.remove}
                </Button>
              </div>
            </div>
            <svelte:self
              path={joinPath(path, index)}
              node={node.item}
              bare
              rowTitle={rowLabel(index)}
            />
          </div>
        {/each}
      </div>
      <Button
        bind:ref={addButton}
        kind="tertiary"
        size="sm"
        icon={Add}
        disabled={state.disabled ||
          (config.maxItems != null && ids.length >= config.maxItems)}
        on:click={addRow}
      >
        {config.addLabel ?? labels.add}
      </Button>
    </FormGroup>
  {/if}
{/if}
