<script>
  /**
   * The control for one property, in the mixed or the shared state.
   * Internal to `PropertyInspector`.
   * @restProps {div}
   */

  /**
   * @type {import("./resolve-mixed.js").PropertyInspectorProperty}
   */
  export let property;

  /**
   * @type {import("./resolve-mixed.js").PropertyState}
   */
  export let state;

  /**
   * Specify the id of the control.
   * @type {string}
   */
  export let id;

  /**
   * Specify the accessible name of the control.
   * @type {string}
   */
  export let name;

  /**
   * @type {"xs" | "sm"}
   */
  export let size = "sm";

  /** Specify the text a mixed value shows. */
  export let mixedText = "Mixed";

  /**
   * Set to `true` for a field that shares its line. It has room for the
   * value but not for the unit, which only the spoken value text keeps.
   */
  export let inline = false;

  /** Specify the accessible name of a color swatch. */
  export let colorPickerText = "Pick a color";

  /**
   * Custom controls by `type`, which win over the built-in ones.
   * @type {Record<string, any>}
   */
  export let widgets = {};

  import { getContext, tick } from "svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import RadioButton from "../RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "../RadioButtonGroup/RadioButtonGroup.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import { keyDelta, parseNumberEdit } from "./number-edit.js";

  const MIXED_VALUE = "__mixed__";
  const HEX = /^#?[0-9a-f]{6}$/i;
  const api = /** @type {import("./resolve-mixed.js").InspectorApi} */ (
    getContext("carbon:PropertyInspector")
  );

  $: type = property.type;
  $: readOnly = state.readOnly;
  $: mixedId = `${id}-mixed`;
  $: describedBy = state.mixed ? mixedId : undefined;
  $: options = property.options ?? [];
  $: step = property.step ?? 1;
  $: unit = property.unit ?? "";
  $: shown = state.mixed ? undefined : state.value;
  $: widget = widgets[type];

  /**
   * What each field is given for the shared or the mixed value.
   * @param {string} type
   * @param {boolean} mixed
   * @param {any} value
   */
  function toDisplay(type, mixed, value) {
    if (type === "number") return value ?? null;
    if (type === "text" || type === "color") return value ?? "";
    if (type === "boolean" || type === "toggle") return mixed ? false : !!value;
    if (type === "select") return mixed ? MIXED_VALUE : value;
    return value;
  }

  $: display = toDisplay(type, state.mixed, shown);

  // The control's own copy of the value. Each Carbon field keeps its value
  // in its own prop, which a person's edit overwrites, so after an edit the
  // copy is set back to what `state` says. A consumer that declines an edit
  // then sees the field return to the old value.
  let local = display;
  let localIndeterminate = state.mixed;
  let lastDisplay = display;
  let lastMixed = state.mixed;
  $: if (display !== lastDisplay || state.mixed !== lastMixed) {
    lastDisplay = display;
    lastMixed = state.mixed;
    local = display;
    localIndeterminate = state.mixed;
  }

  async function reconcile() {
    await tick();
    local = display;
    localIndeterminate = state.mixed;
  }

  /**
   * @param {unknown} value
   */
  function setValue(value) {
    api.commit(property.id, { kind: "set", value }, "input");
    reconcile();
  }

  // Number

  /** @type {boolean} */
  let keyGesture = false;
  let keyTotal = 0;

  $: valueText = state.mixed
    ? mixedText
    : shown == null
      ? ""
      : `${shown}${unit ? ` ${property.unitLabel ?? unit}` : ""}`;

  /** @param {KeyboardEvent} event */
  function handleNumberKeydown(event) {
    if (readOnly) return;
    const delta = keyDelta(event.key, {
      step,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    });
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    if (!keyGesture) {
      const input = /** @type {HTMLInputElement} */ (event.target);
      const typed = parseNumberEdit(input.value, unit);
      if (typed && input.value.trim() !== String(shown ?? "")) {
        api.commit(property.id, typed, "input");
      }
      api.start(property.id, "key");
      keyGesture = true;
      keyTotal = 0;
    }
    keyTotal = Number((keyTotal + delta).toFixed(10));
    api.update(property.id, { kind: "add", n: keyTotal });
  }

  function endKeyGesture() {
    if (!keyGesture) return;
    keyGesture = false;
    api.end(property.id);
    reconcile();
  }

  /** @param {KeyboardEvent} event */
  function handleNumberKeyup(event) {
    if (keyDelta(event.key, { step })) endKeyGesture();
  }

  // The capture phase reads what was typed before `NumberInput` parses it,
  // which would turn "+10" into 10. `NumberInput` then writes that 10 to its
  // value after this listener returns and its microtasks have run, so the
  // copy is set back on a later task.
  /** @param {Event} event */
  function handleNumberChange(event) {
    if (readOnly) return;
    const input = /** @type {HTMLInputElement} */ (event.target);
    const edit = parseNumberEdit(input.value, unit);
    if (edit) api.commit(property.id, edit, "input");
    setTimeout(reconcile);
  }

  // Text

  $: textPlaceholder = state.mixed ? mixedText : (property.placeholder ?? "");

  /** @param {KeyboardEvent} event */
  function handleTextKeydown(event) {
    if (event.key === "Escape" && local !== shown) {
      local = shown;
      event.stopPropagation();
    }
  }

  // Color

  $: swatch =
    typeof shown === "string" && HEX.test(shown) && shown.startsWith("#")
      ? shown
      : "#000000";
  let colorGesture = false;

  /** @param {Event} event */
  function handleSwatchInput(event) {
    const value = /** @type {HTMLInputElement} */ (event.target).value;
    if (!colorGesture) {
      api.start(property.id, "input");
      colorGesture = true;
    }
    api.update(property.id, { kind: "set", value });
  }

  function handleSwatchChange() {
    if (colorGesture) {
      colorGesture = false;
      api.end(property.id);
    }
    reconcile();
  }

  /** @param {CustomEvent<string | number | null>} event */
  function handleHexChange(event) {
    const value = String(event.detail).trim();
    const normalized = HEX.test(value)
      ? `#${value.replace("#", "").toLowerCase()}`
      : null;
    if (normalized)
      api.commit(property.id, { kind: "set", value: normalized }, "input");
    reconcile();
  }

  // Boolean

  /** @param {CustomEvent<boolean>} event */
  function handleCheck(event) {
    // `check` also fires when the copy is set back to `display`.
    if (event.detail === display) return;
    setValue(event.detail);
  }

  /** @param {CustomEvent<{ toggled: boolean }>} event */
  function handleToggle(event) {
    if (event.detail.toggled === display) return;
    setValue(event.detail.toggled);
  }

  // Choice

  /** @param {CustomEvent<unknown>} event */
  function handleSelectUpdate(event) {
    if (event.detail === MIXED_VALUE) return;
    if (event.detail === shown) return;
    setValue(event.detail);
  }

  /** @param {CustomEvent<{ selectedId: unknown }>} event */
  function handleDropdownSelect(event) {
    if (event.detail.selectedId === shown) return;
    setValue(event.detail.selectedId);
  }

  /** @param {CustomEvent<unknown>} event */
  function handleRadioChange(event) {
    if (event.detail === shown || event.detail == null) return;
    setValue(event.detail);
  }

  /** @param {"input" | "key" | "scrub"} source */
  function widgetStart(source) {
    api.start(property.id, source);
  }

  /** @param {import("./resolve-mixed.js").PropertyEdit} edit */
  function widgetUpdate(edit) {
    api.update(property.id, edit);
  }

  function widgetEnd() {
    api.end(property.id);
  }

  $: dropdownItems = options.map((option) => ({
    id: option.value,
    text: option.label,
  }));
</script>

{#if widget}
  <svelte:component
    this={widget}
    {property}
    {state}
    {id}
    {name}
    {size}
    {mixedText}
    {readOnly}
    start={widgetStart}
    update={widgetUpdate}
    end={widgetEnd}
    commit={setValue}
  />
{:else if type === "number"}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--property-inspector__number={true}
    class:bx--property-inspector__number--unit={!!unit &&
      !state.mixed &&
      !inline}
    on:keydown|capture={handleNumberKeydown}
    on:keyup|capture={handleNumberKeyup}
    on:change|capture={handleNumberChange}
    on:focusout={endKeyGesture}
  >
    <NumberInput
      bind:value={local}
      {id}
      {size}
      allowDecimal
      allowEmpty
      hideSteppers
      selectTextOnFocus
      readonly={readOnly}
      placeholder={state.mixed ? mixedText : ""}
      role="spinbutton"
      autocomplete="off"
      aria-label={name}
      aria-valuenow={state.mixed || shown == null ? undefined : Number(shown)}
      aria-valuemin={property.min}
      aria-valuemax={property.max}
      aria-valuetext={valueText || undefined}
      aria-describedby={describedBy}
    />
    {#if unit && !state.mixed && !inline}
      <span class:bx--property-inspector__unit={true} aria-hidden="true"
        >{unit}</span
      >
    {/if}
    {#if state.mixed}
      <span id={mixedId} class:bx--visually-hidden={true}>{mixedText}</span>
    {/if}
  </div>
{:else if type === "text"}
  <TextInput
    bind:value={local}
    {id}
    {size}
    labelText={name}
    hideLabel
    selectTextOnFocus
    readonly={readOnly}
    placeholder={textPlaceholder}
    aria-describedby={describedBy}
    on:change={(event) => {
      if (event.detail !== shown) setValue(event.detail);
    }}
    on:keydown={handleTextKeydown}
  />
  {#if state.mixed}
    <span id={mixedId} class:bx--visually-hidden={true}>{mixedText}</span>
  {/if}
{:else if type === "boolean"}
  <Checkbox
    bind:checked={local}
    bind:indeterminate={localIndeterminate}
    {id}
    labelText={name}
    hideLabel
    noMargin
    readonly={readOnly}
    on:check={handleCheck}
  />
{:else if type === "toggle"}
  <div
    class:bx--property-inspector__toggle={true}
    class:bx--property-inspector__toggle--mixed={state.mixed}
  >
    <Toggle
      bind:toggled={local}
      {id}
      size="sm"
      labelText={name}
      hideLabel
      labelA=""
      labelB=""
      readonly={readOnly}
      aria-describedby={describedBy}
      on:toggle={handleToggle}
    />
    {#if state.mixed}
      <span id={mixedId} class:bx--visually-hidden={true}>{mixedText}</span>
    {/if}
  </div>
{:else if type === "select"}
  <Select
    bind:selected={local}
    {id}
    {size}
    labelText={name}
    hideLabel
    readonly={readOnly}
    on:update={handleSelectUpdate}
  >
    {#if state.mixed}
      <SelectItem value={MIXED_VALUE} text={mixedText} hidden disabled />
    {/if}
    {#each options as option (option.value)}
      <SelectItem value={option.value} text={option.label} />
    {/each}
  </Select>
{:else if type === "dropdown"}
  <Dropdown
    bind:selectedId={local}
    {id}
    {size}
    items={dropdownItems}
    labelText={name}
    hideLabel
    label={state.mixed ? mixedText : property.placeholder}
    readonly={readOnly}
    on:select={handleDropdownSelect}
  />
{:else if type === "radio"}
  <RadioButtonGroup
    bind:selected={local}
    legendText={name}
    hideLegend
    readonly={readOnly}
    aria-describedby={describedBy}
    on:change={handleRadioChange}
  >
    {#each options as option (option.value)}
      <RadioButton value={option.value} labelText={option.label} />
    {/each}
  </RadioButtonGroup>
  {#if state.mixed}
    <span id={mixedId} class:bx--visually-hidden={true}>{mixedText}</span>
  {/if}
{:else if type === "color"}
  <div
    class:bx--property-inspector__color={true}
    class:bx--property-inspector__color--mixed={state.mixed}
  >
    <span class:bx--property-inspector__swatch={true}>
      <input
        type="color"
        id="{id}-swatch"
        class:bx--property-inspector__swatch-input={true}
        value={swatch}
        disabled={readOnly}
        aria-label={colorPickerText}
        aria-describedby={describedBy}
        on:input={handleSwatchInput}
        on:change={handleSwatchChange}
      />
      {#if state.mixed}
        <span
          class:bx--property-inspector__swatch-mixed={true}
          aria-hidden="true"
        ></span>
      {/if}
    </span>
    <TextInput
      bind:value={local}
      {id}
      {size}
      labelText={name}
      hideLabel
      selectTextOnFocus
      readonly={readOnly}
      placeholder={state.mixed ? mixedText : ""}
      aria-describedby={describedBy}
      on:change={handleHexChange}
    />
    {#if state.mixed}
      <span id={mixedId} class:bx--visually-hidden={true}>{mixedText}</span>
    {/if}
  </div>
{/if}
