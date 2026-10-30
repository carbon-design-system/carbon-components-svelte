<script context="module">
  /**
   * @typedef {"text" | "number" | "date" | "option" | "boolean"} QueryFieldKind
   */

  /**
   * @typedef {object} QueryFieldOption
   * @property {string | number} id
   * @property {string} text
   */

  /**
   * @typedef {object} QueryField
   * @property {string} id - Stored in a condition's `field`
   * @property {string} label - Shown in the field list and in sentences
   * @property {QueryFieldKind} kind - Decides the operators and the value input
   * @property {ReadonlyArray<QueryFieldOption>} [options] - Choices of an `"option"` field
   * @property {ReadonlyArray<import("./query-text.js").QueryOperator>} [operators] - Offer only these operators, in this order
   * @property {number} [min] - Lowest value of a `"number"` field
   * @property {number} [max] - Highest value of a `"number"` field
   * @property {number} [step] - Step of a `"number"` field
   * @property {string} [placeholder] - Placeholder of a `"text"` field
   * @property {(row: any) => unknown} [getValue] - Read the field from a row in `evaluateQuery`. Defaults to `row[id]`.
   */

  /**
   * A condition's value depends on the field kind and operator: a string
   * (`"text"`, and a `"date"` as `"2026-05-01"`), a number, a boolean, an
   * option id, a pair for `"between"`, a list of option ids for `"isAnyOf"`,
   * and `null` for `"isEmpty"`.
   * @typedef {object} QueryCondition
   * @property {string} [id] - Filled in by the builder when missing
   * @property {string} field - A `QueryField` id
   * @property {string} operator - An operator of the field's kind
   * @property {unknown} value
   */

  /**
   * @typedef {object} QueryGroup
   * @property {string} [id] - Filled in by the builder when missing
   * @property {"and" | "or"} operator - Whether all or any of the conditions must match
   * @property {Array<QueryCondition | QueryGroup>} conditions
   */
</script>

<script>
  /**
   * @restProps {div}
   * @event {QueryGroup} change
   */

  /**
   * Specify the fields conditions can test.
   * @type {ReadonlyArray<QueryField>}
   */
  export let fields = [];

  /**
   * Specify the query: a root group of conditions and nested groups.
   * Nodes without an `id` get one.
   * @type {QueryGroup}
   * @bindable writable
   */
  export let value = { operator: "and", conditions: [] };

  /**
   * Specify how many levels of groups can nest. The root group is level 1,
   * so the default of `3` allows a group in a group in a group.
   */
  export let maxDepth = 3;

  /**
   * Specify the size of the fields and buttons.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the label text */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label.
   * The label remains available to screen readers.
   */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state for the whole query */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /**
   * Set to `true` to mark every incomplete condition as invalid. Otherwise
   * a condition shows its error after focus leaves its value.
   */
  export let showErrors = false;

  /** Set to `true` to show the query as a sentence below the builder */
  export let showSummary = false;

  /** Set to `true` to disable every field and button */
  export let disabled = false;

  /** Set to `true` to show the query without letting people edit it */
  export let readonly = false;

  /**
   * Override the text. Receives an id such as `"addCondition"` or
   * `"op.contains"` and values for its `{name}` placeholders. Return nothing
   * for an id to keep its English default.
   * @type {(id: import("./query-text.js").QueryTextId, values?: Record<string, string | number>) => string | undefined}
   */
  export let translateWithId = defaultTranslate;

  /** Specify the id of the root element. Derived ids build on it. */
  export let id = uniqueId();

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { uniqueId } from "../utils/unique-id.js";
  import QueryBuilderGroup from "./QueryBuilderGroup.svelte";
  import { defaultTranslate, withFallback } from "./query-text.js";
  import {
    appendNode,
    assignIds,
    findNode,
    hasIds,
    moveNode,
    removeNode,
    updateNode,
  } from "./query-tree.js";
  import {
    emptyValue,
    indexFields,
    isQueryGroup,
    operatorsFor,
    queryToText,
    validateQuery,
  } from "./query.js";

  const dispatch = createEventDispatcher();

  /** @type {import("svelte/store").Writable<import("./query-tree.js").QueryBuilderSettings>} */
  const settings = writable(/** @type {any} */ ({}));
  /** @type {import("svelte/store").Writable<Record<string, import("./query.js").QueryErrorCode>>} */
  const errors = writable({});
  /** @type {import("svelte/store").Writable<Record<string, true>>} */
  const touched = writable({});

  /** @type {import("./query.js").QueryTranslate} */
  let translate = defaultTranslate;
  let seq = 0;
  let status = "";
  /** @type {HTMLDivElement | null} */
  let rootRef = null;

  /** @returns {string} */
  function makeId() {
    seq += 1;
    return `q${seq}`;
  }

  $: if (!hasIds(value)) value = assignIds(value, makeId);
  $: translate = withFallback(translateWithId);
  $: fieldsById = indexFields(fields);
  $: validation = validateQuery(value, fieldsById);
  $: errors.set(validation.errors);
  // The naming attributes belong on the root group, which carries the role.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: labelId = ariaLabelledBy ?? (labelText ? `${id}-label` : undefined);
  $: describedBy = joinDescribedBy(
    ariaDescribedBy,
    helperText && !invalid ? `${id}-helper` : "",
    invalid && invalidText ? `${id}-error` : "",
    showSummary ? `${id}-summary` : "",
  );
  $: settings.set({
    translate,
    fieldsById,
    fields,
    size,
    id,
    disabled,
    readonly,
    showErrors,
    maxDepth,
    ariaLabel,
    labelId,
    describedBy,
  });
  $: summary = showSummary ? queryToText(value, fieldsById, translate) : "";

  /**
   * @param {import("./QueryBuilder.svelte").QueryGroup} next
   * @param {string} [message]
   */
  function commit(next, message) {
    value = next;
    dispatch("change", next);
    if (message) announce(message);
  }

  /** @param {string} message */
  async function announce(message) {
    // A repeated message is only read again if the region changed in between.
    status = "";
    await tick();
    status = message;
  }

  /** @param {string} target */
  async function focusById(target) {
    await tick();
    /** @type {HTMLElement | null | undefined} */ (
      rootRef?.querySelector(`[id="${target}"]`)
    )?.focus();
  }

  /**
   * @param {string} fieldId
   * @param {string} nodeId
   */
  function newCondition(fieldId, nodeId) {
    const field = fieldsById.get(fieldId);
    if (!field)
      return { id: nodeId, field: fieldId, operator: "is", value: null };
    const operator = operatorsFor(field)[0];
    return {
      id: nodeId,
      field: field.id,
      operator,
      value: emptyValue(field, operator),
    };
  }

  /**
   * @param {string} nodeId
   * @param {Record<string, unknown>} patch
   */
  function update(nodeId, patch) {
    commit(updateNode(value, nodeId, patch));
  }

  /** @param {string} nodeId */
  function touch(nodeId) {
    if (!$touched[nodeId])
      touched.update((map) => ({ ...map, [nodeId]: true }));
  }

  /**
   * @param {string} groupId
   * @param {"condition" | "group"} kind
   */
  function add(groupId, kind) {
    const first = fields[0];
    if (!first) return;
    const condition = newCondition(first.id, makeId());
    if (kind === "condition") {
      commit(
        appendNode(value, groupId, condition),
        translate("announceConditionAdded"),
      );
      focusById(`${id}-${condition.id}-field`);
      return;
    }
    const group = { id: makeId(), operator: "and", conditions: [condition] };
    commit(
      appendNode(value, groupId, /** @type {any} */ (group)),
      translate("announceGroupAdded"),
    );
    focusById(`${id}-${condition.id}-field`);
  }

  /** @param {string} nodeId */
  function remove(nodeId) {
    const found = findNode(value, nodeId);
    if (!found?.parent) return;
    const { parent, index, node } = found;
    const neighbor =
      parent.conditions[index + 1] ?? parent.conditions[index - 1];
    commit(
      removeNode(value, nodeId),
      translate(
        isQueryGroup(node)
          ? "announceGroupRemoved"
          : "announceConditionRemoved",
      ),
    );
    if (neighbor)
      focusById(
        `${id}-${neighbor.id}-${isQueryGroup(neighbor) ? "logic" : "field"}`,
      );
    else focusById(`${id}-${parent.id}-add`);
  }

  /**
   * @param {string} nodeId
   * @param {number} delta
   */
  function move(nodeId, delta) {
    const next = moveNode(value, nodeId, delta);
    if (next === value) return;
    const found = findNode(next, nodeId);
    commit(
      next,
      translate("announceMoved", {
        n: (found?.index ?? 0) + 1,
        total: found?.parent?.conditions.length ?? 1,
      }),
    );
    // A group's actions are in its menu, which closes on a choice; focus
    // returns to the menu button.
    if (found && isQueryGroup(found.node)) {
      focusById(`${id}-${nodeId}-menu`);
      return;
    }
    // The button that was pressed may be disabled at the new end; hand
    // focus to the other so it stays on the row.
    const atEdge =
      found?.parent &&
      (delta < 0
        ? found.index === 0
        : found.index === found.parent.conditions.length - 1);
    focusById(
      `${id}-${nodeId}-${atEdge ? (delta < 0 ? "down" : "up") : delta < 0 ? "up" : "down"}`,
    );
  }

  setContext("carbon:QueryBuilder", {
    settings,
    errors,
    touched,
    update,
    touch,
    add,
    remove,
    move,
  });
</script>

<div
  bind:this={rootRef}
  {id}
  class:bx--query-builder={true}
  class:bx--query-builder--sm={size === "sm"}
  class:bx--query-builder--disabled={disabled}
  class:bx--query-builder--readonly={readonly}
  class:bx--query-builder--invalid={invalid}
  {...rest}
>
  {#if labelText}
    <span
      id={labelId}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}>{labelText}</span
    >
  {/if}
  <!-- Helper and error text follow the label. Below the builder they would
    sit after every row and the add buttons, far from the label. -->
  {#if helperText && !invalid}
    <div
      id="{id}-helper"
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if invalid && invalidText}
    <!-- The modifier shows the message, which Carbon hides unless it follows
      an invalid input; role="alert" announces it, as FormRequirement does. -->
    <div
      id="{id}-error"
      class="bx--form-requirement bx--form-requirement--invalid"
      role="alert"
    >
      {invalidText}
    </div>
  {/if}
  <QueryBuilderGroup node={value} />
  {#if showSummary}
    <div class="bx--query-builder__summary">
      <span class:bx--label={true} class:bx--label--disabled={disabled}
        >{translate("summaryLabel")}</span
      >
      <p id="{id}-summary" class="bx--query-builder__summary-text">
        {summary
          ? translate("summary", { text: summary })
          : translate("summaryEmpty")}
      </p>
    </div>
  {/if}
  <div
    class="bx--visually-hidden"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {status}
  </div>
</div>
