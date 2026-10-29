<script>
  /**
   * One row of a `QueryBuilder`: field, operator, value, and the row actions.
   * Not exported; `QueryBuilderGroup` renders it.
   */

  /**
   * @type {import("./QueryBuilder.svelte").QueryCondition}
   */
  export let node;

  /** Position among its siblings, from 0. */
  export let index = 0;

  /** Number of siblings, groups included. */
  export let total = 1;

  /**
   * @type {"and" | "or"}
   */
  export let groupOperator = "and";

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import DatePicker from "../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../DatePicker/DatePickerInput.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import MultiSelect from "../MultiSelect/MultiSelect.svelte";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Close from "../icons/Close.svelte";
  import {
    carryValue,
    conditionToText,
    emptyValue,
    operatorsFor,
    valueArity,
  } from "./query.js";

  /** @type {import("./query-tree.js").QueryBuilderContext} */
  const { settings, errors, touched, update, touch, remove, move } = getContext(
    "carbon:QueryBuilder",
  );

  $: ({
    translate,
    fieldsById,
    fields,
    size,
    id,
    disabled,
    readonly,
    showErrors,
  } = $settings);
  /** @type {"sm" | undefined} */
  let controlSize;
  /** @type {"small" | "field"} */
  let buttonSize;
  /** @type {"sm" | "default"} */
  let toggleSize;
  /** @type {string | number | undefined} */
  let selectedOption;
  let nodeId = "";
  /** @type {import("./query.js").QueryErrorCode | undefined} */
  let error;

  $: nodeId = node.id ?? "";
  $: field = fieldsById.get(node.field);
  $: operators = field ? operatorsFor(field) : [];
  $: arity = valueArity(node.operator);
  $: controlSize = size === "sm" ? "sm" : undefined;
  $: buttonSize = size === "sm" ? "small" : "field";
  $: toggleSize = size === "sm" ? "sm" : "default";
  $: selectedOption =
    typeof node.value === "string" || typeof node.value === "number"
      ? node.value
      : undefined;
  $: error = $errors[nodeId];
  $: invalid = Boolean(error) && (showErrors || Boolean($touched[nodeId]));
  $: errorText = error
    ? translate(`error.${error}`, {
        min: field?.min ?? "",
        max: field?.max ?? "",
      })
    : "";
  $: connector = index === 0 ? translate("where") : translate(groupOperator);
  // Shown at the start of the row, so in sentence case; the accessible name
  // and the summary keep the lowercase word inside their sentence.
  $: connectorText =
    index === 0
      ? translate("where")
      : translate(groupOperator === "and" ? "connectorAnd" : "connectorOr");
  $: sentence = conditionToText(node, field, translate);
  $: label = translate("conditionLabel", {
    n: index + 1,
    total,
    text: `${connector} ${sentence || field?.label || ""}`.trim(),
  });
  $: base = `${id}-${nodeId}`;

  /** @param {string} fieldId */
  function setField(fieldId) {
    const next = fieldsById.get(fieldId);
    if (!next || next.id === node.field) return;
    const sameKind = field?.kind === next.kind;
    const keep =
      sameKind &&
      operatorsFor(next).includes(/** @type {any} */ (node.operator));
    const operator = keep ? node.operator : operatorsFor(next)[0];
    update(nodeId, {
      field: next.id,
      operator,
      value:
        keep && next.kind !== "option"
          ? node.value
          : emptyValue(next, operator),
    });
  }

  /** @param {string} operator */
  function setOperator(operator) {
    if (!field || operator === node.operator) return;
    update(nodeId, {
      operator,
      value: carryValue(field, node.operator, operator, node.value),
    });
  }

  /** @param {unknown} value */
  function setValue(value) {
    update(nodeId, { value });
  }

  /**
   * @param {number} position
   * @param {unknown} next
   */
  function setPart(position, next) {
    const pair = Array.isArray(node.value) ? [...node.value] : [null, null];
    pair[position] = next;
    update(nodeId, { value: pair });
  }

  /** @param {CustomEvent<any>} event */
  function handleDate(event) {
    const detail = event.detail;
    setValue(typeof detail === "string" ? detail : (detail?.dateStr ?? ""));
  }

  /** @param {CustomEvent<string | { dateStr: { from: string; to: string } | string }>} event */
  function handleRange(event) {
    const detail = event.detail;
    const range =
      typeof detail === "object" && detail && typeof detail.dateStr === "object"
        ? detail.dateStr
        : { from: "", to: "" };
    setValue([range.from ?? "", range.to ?? ""]);
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const cell = /** @type {HTMLElement} */ (event.currentTarget);
    if (!cell.contains(/** @type {Node | null} */ (event.relatedTarget))) {
      touch(nodeId);
    }
  }

  /** @param {unknown} value */
  function toRange(value) {
    return Array.isArray(value) ? value : [null, null];
  }
</script>

<div
  class="bx--query-builder__condition"
  class:bx--query-builder__condition--invalid={invalid}
  role="group"
  aria-label={label}
>
  <span class="bx--query-builder__connector" aria-hidden="true"
    >{connectorText}</span
  >
  <div class="bx--query-builder__cell bx--query-builder__cell--field">
    <Select
      id="{base}-field"
      size={controlSize}
      labelText={translate("field")}
      hideLabel
      selected={field ? field.id : ""}
      invalid={!field && invalid}
      invalidText={field ? "" : errorText}
      {disabled}
      {readonly}
      on:update={(event) => setField(String(event.detail))}
    >
      {#if !field}
        <SelectItem value="" text={translate("chooseField")} disabled hidden />
      {/if}
      {#each fields as option (option.id)}
        <SelectItem value={option.id} text={option.label} />
      {/each}
    </Select>
  </div>
  <div class="bx--query-builder__cell bx--query-builder__cell--operator">
    {#if operators.length > 0}
      <!-- A field with one operator shows it read only, so the column
        keeps its field and its text lines up with the rows around it. -->
      <Select
        id="{base}-operator"
        size={controlSize}
        labelText={translate("operator")}
        hideLabel
        selected={node.operator}
        {disabled}
        readonly={readonly || operators.length === 1}
        on:update={(event) => setOperator(String(event.detail))}
      >
        {#each operators as operator (operator)}
          <SelectItem value={operator} text={translate(`op.${operator}`)} />
        {/each}
      </Select>
    {/if}
  </div>
  {#if field && arity !== "none"}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bx--query-builder__cell bx--query-builder__cell--value"
      class:bx--query-builder__cell--pair={arity === "two"}
      on:focusout={handleFocusout}
    >
      {#if field.kind === "text"}
        <TextInput
          id="{base}-value"
          size={controlSize}
          labelText={translate("value")}
          hideLabel
          placeholder={field.placeholder}
          value={typeof node.value === "string" ? node.value : ""}
          {invalid}
          invalidText={errorText}
          {disabled}
          {readonly}
          on:input={(event) => setValue(event.detail)}
        />
      {:else if field.kind === "number" && arity === "one"}
        <NumberInput
          id="{base}-value"
          size={controlSize}
          labelText={translate("value")}
          hideLabel
          allowEmpty
          hideSteppers
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof node.value === "number" ? node.value : null}
          {invalid}
          invalidText={errorText}
          {disabled}
          {readonly}
          on:input={(event) => setValue(event.detail)}
        />
      {:else if field.kind === "number"}
        {#each [0, 1] as position (position)}
          <NumberInput
            id="{base}-value{position === 0 ? '' : '-to'}"
            size={controlSize}
            labelText={translate(position === 0 ? "valueFrom" : "valueTo")}
            hideLabel
            allowEmpty
            hideSteppers
            min={field.min}
            max={field.max}
            step={field.step}
            value={typeof toRange(node.value)[position] === "number"
              ? toRange(node.value)[position]
              : null}
            invalid={invalid && position === 0}
            invalidText={position === 0 ? errorText : ""}
            {disabled}
            {readonly}
            on:input={(event) => setPart(position, event.detail)}
          />
        {/each}
      {:else if field.kind === "date" && arity === "one"}
        <DatePicker
          datePickerType="single"
          dateFormat="Y-m-d"
          value={typeof node.value === "string" ? node.value : ""}
          on:change={handleDate}
        >
          <DatePickerInput
            id="{base}-value"
            size={controlSize}
            labelText={translate("value")}
            hideLabel
            placeholder={translate("datePlaceholder")}
            {invalid}
            invalidText={errorText}
            {disabled}
            {readonly}
          />
        </DatePicker>
      {:else if field.kind === "date"}
        <DatePicker
          datePickerType="range"
          dateFormat="Y-m-d"
          valueFrom={toRange(node.value)[0] ?? ""}
          valueTo={toRange(node.value)[1] ?? ""}
          on:change={handleRange}
        >
          <DatePickerInput
            id="{base}-value"
            size={controlSize}
            labelText={translate("valueFrom")}
            hideLabel
            placeholder={translate("datePlaceholder")}
            {invalid}
            invalidText={errorText}
            {disabled}
            {readonly}
          />
          <DatePickerInput
            id="{base}-value-to"
            size={controlSize}
            labelText={translate("valueTo")}
            hideLabel
            placeholder={translate("datePlaceholder")}
            {invalid}
            {disabled}
            {readonly}
          />
        </DatePicker>
      {:else if field.kind === "option" && arity === "one"}
        <Dropdown
          id="{base}-value"
          size={controlSize}
          labelText={translate("value")}
          hideLabel
          label={translate("chooseOption")}
          items={field.options ?? []}
          selectedId={selectedOption}
          {invalid}
          invalidText={errorText}
          {disabled}
          {readonly}
          on:select={(event) => setValue(event.detail.selectedId)}
        />
      {:else if field.kind === "option"}
        <MultiSelect
          id="{base}-value"
          size={controlSize}
          labelText={translate("value")}
          hideLabel
          label={translate("chooseOptions")}
          items={field.options ?? []}
          selectedIds={Array.isArray(node.value) ? node.value : []}
          {invalid}
          invalidText={errorText}
          {disabled}
          {readonly}
          on:select={(event) => setValue(event.detail.selectedIds)}
        />
      {:else if field.kind === "boolean"}
        <Toggle
          id="{base}-value"
          size={toggleSize}
          labelText={translate("value")}
          hideLabel
          labelA={translate("false")}
          labelB={translate("true")}
          toggled={node.value === true}
          {disabled}
          {readonly}
          on:toggle={(event) => setValue(event.detail.toggled)}
        />
      {/if}
    </div>
  {/if}
  {#if !readonly}
    <div class="bx--query-builder__actions">
      <Button
        id="{base}-up"
        kind="ghost"
        size={buttonSize}
        icon={ArrowUp}
        iconDescription={translate("moveUp", { n: index + 1 })}
        disabled={disabled || index === 0}
        on:click={() => move(nodeId, -1)}
      />
      <Button
        id="{base}-down"
        kind="ghost"
        size={buttonSize}
        icon={ArrowDown}
        iconDescription={translate("moveDown", { n: index + 1 })}
        disabled={disabled || index === total - 1}
        on:click={() => move(nodeId, 1)}
      />
      <Button
        id="{base}-remove"
        kind="ghost"
        size={buttonSize}
        icon={Close}
        iconDescription={translate("removeCondition", { n: index + 1 })}
        {disabled}
        on:click={() => remove(nodeId)}
      />
    </div>
  {/if}
</div>
