<script>
  /**
   * @typedef {import("../utils/color.js").ColorFormat} ColorPickerFormat
   * @typedef {import("../utils/color.js").Hsva} ColorPickerColor
   * @typedef {import("./ColorSwatches.svelte").ColorSwatch} ColorPickerSwatch
   * @typedef {"group" | "area" | "areaRoleDescription" | "areaValue" | "hue" | "hueValue" | "alpha" | "alphaValue" | "format" | "hex" | "red" | "green" | "blue" | "hueField" | "saturation" | "lightness" | "swatches" | "recent" | "eyeDropper" | "invalidColor" | "lowContrast"} ColorPickerTranslationId
   * @restProps {div}
   * @event {string} input
   * @event {string} change
   */

  /**
   * Specify the color as a CSS color string: `#rgb`, `#rrggbb`,
   * `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()` or `hsla()`. A value in any
   * other form is ignored. Interaction writes it back in `format`.
   * @bindable writable
   */
  export let value = "#000000";

  /**
   * Specify the format of the text fields, and of `value` once the color
   * changes. The format switch changes it.
   * @type {ColorPickerFormat}
   * @bindable writable
   */
  export let format = "hex";

  /**
   * Set to `true` to add an alpha slider and field. Without it, `value` is
   * always opaque.
   */
  export let alpha = false;

  /**
   * Specify preset colors, shown as a grid of swatches. Each is a CSS
   * color, or `{ value, label }` to name it for a screen reader.
   * @type {ReadonlyArray<ColorPickerSwatch>}
   */
  export let swatches = [];

  /** Specify the number of swatches in each row of the grid */
  export let swatchColumns = 8;

  /**
   * Specify the recently chosen colors, newest first, as CSS color strings.
   * The picker adds a color when a pick settles: the end of a drag, a typed
   * value, a swatch, the eyedropper, or focus leaving a control whose value
   * the keyboard changed. Bind it to keep the list.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let recent = [];

  /** Specify how many recent colors to keep. Set to `0` to hide the row. */
  export let recentLimit = 8;

  /**
   * Specify the color the chosen color sits on, as a CSS color string. The
   * picker warns when the two are closer than `minContrast`.
   * @type {string | undefined}
   */
  export let background = undefined;

  /**
   * Specify the lowest WCAG contrast ratio against `background` that does
   * not warn: 4.5 for text, 3 for an icon or a border.
   */
  export let minContrast = 4.5;

  /**
   * Set to `true` to hide the eyedropper button. It shows only where the
   * browser has the EyeDropper API.
   */
  export let hideEyeDropper = false;

  /** Set to `true` to hide the format switch and the text fields */
  export let hideInputs = false;

  /** Set to `true` to disable the picker */
  export let disabled = false;

  /**
   * Name a color for a screen reader, as in "dark teal". The default names
   * a color in English.
   * @type {(color: ColorPickerColor) => string}
   */
  export let formatColorName = describeColor;

  /**
   * Override the default text. A value may hold `{saturation}`,
   * `{brightness}`, `{color}`, `{degrees}`, `{alpha}` or `{min}`, where the
   * default holds them.
   * @type {(id: ColorPickerTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /**
   * Set an id for the root element. The ids of the fields and the contrast
   * warning derive from it.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the area's thumb, which a caller can focus.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let areaRef = null;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Eyedropper from "../icons/Eyedropper.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    colorContrast,
    describeColor,
    formatColor,
    formatHex,
    hslaToHsva,
    hsvaToHsla,
    hsvaToRgba,
    parseColor,
    rgbaToHsva,
    sameColor,
    to8Bit,
    wrapHue,
  } from "../utils/color.js";
  import { uniqueId } from "../utils/unique-id.js";
  import ColorArea from "./ColorArea.svelte";
  import ColorSlider from "./ColorSlider.svelte";
  import ColorSwatches from "./ColorSwatches.svelte";

  const defaultTranslations = {
    group: "Color picker",
    area: "Saturation and brightness",
    areaRoleDescription: "2D slider",
    areaValue: "Saturation {saturation}%, brightness {brightness}%, {color}",
    hue: "Hue",
    hueValue: "{degrees} degrees, {color}",
    alpha: "Alpha",
    alphaValue: "{alpha}%",
    format: "Color format",
    hex: "Hex",
    red: "Red",
    green: "Green",
    blue: "Blue",
    hueField: "Hue",
    saturation: "Saturation",
    lightness: "Lightness",
    swatches: "Preset colors",
    recent: "Recent colors",
    eyeDropper: "Pick a color from the screen",
    invalidColor: "Enter a color such as #0f62fe",
    lowContrast: "Contrast with the background is below {min}:1",
  };

  const BARE_HEX = /^[0-9a-f]{3,8}$/i;

  /** @type {ReadonlyArray<{ channel: "r" | "g" | "b"; name: ColorPickerTranslationId; caption: string }>} */
  const RGB_FIELDS = [
    { channel: "r", name: "red", caption: "R" },
    { channel: "g", name: "green", caption: "G" },
    { channel: "b", name: "blue", caption: "B" },
  ];

  /** @type {ReadonlyArray<{ channel: "h" | "s" | "l"; name: ColorPickerTranslationId; caption: string; max: number }>} */
  const HSL_FIELDS = [
    { channel: "h", name: "hueField", caption: "H", max: 360 },
    { channel: "s", name: "saturation", caption: "S", max: 100 },
    { channel: "l", name: "lightness", caption: "L", max: 100 },
  ];
  const dispatch = createEventDispatcher();

  /**
   * Fill `{name}` placeholders.
   * @param {string} template
   * @param {Record<string, string | number>} values
   */
  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      name in values ? String(values[name]) : match,
    );
  }

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  /** @type {ColorPickerColor} */
  let hsva = { h: 0, s: 0, v: 0, a: 1 };
  // What the picker last wrote to `value`, so an echo from a parent is not
  // read back and does not move the thumb.
  let lastEmitted = "";
  let dirty = false;

  /** @returns {ColorPickerColor} */
  function current() {
    return alpha ? hsva : { ...hsva, a: 1 };
  }

  /** @param {string} next */
  function syncFromValue(next) {
    if (next === lastEmitted) return;
    const rgba = parseColor(next);
    if (!rgba) return;
    const target = { ...rgba, a: alpha ? rgba.a : 1 };
    if (sameColor(hsvaToRgba(current()), target)) return;
    hsva = rgbaToHsva(target, hsva.h);
  }

  $: syncFromValue(value);

  /** @param {"input" | "change"} type */
  function emit(type) {
    const next = formatColor(current(), format);
    lastEmitted = next;
    value = next;
    dispatch(type, next);
  }

  /** @param {ColorPickerColor} next */
  function update(next) {
    hsva = next;
    dirty = true;
    emit("input");
  }

  /** @param {ColorPickerColor} next */
  function change(next) {
    update(next);
    emit("change");
  }

  function remember() {
    if (!dirty) return;
    dirty = false;
    if (recentLimit <= 0) return;
    const css = formatColor(current(), format);
    const rgba = parseColor(css);
    if (!rgba) return;
    recent = [
      css,
      ...recent.filter((item) => {
        const other = parseColor(item);
        return !(other && sameColor(other, rgba));
      }),
    ].slice(0, recentLimit);
  }

  /** @param {CustomEvent<{ saturation: number; brightness: number }>} event */
  function handleArea(event) {
    update({
      ...hsva,
      s: event.detail.saturation,
      v: event.detail.brightness,
    });
  }

  function handleAreaChange() {
    emit("change");
  }

  /** @param {CustomEvent<number>} event */
  function handleHue(event) {
    update({ ...hsva, h: event.detail });
  }

  function handleHueChange() {
    emit("change");
  }

  /** @param {CustomEvent<number>} event */
  function handleAlpha(event) {
    update({ ...hsva, a: event.detail / 100 });
  }

  function handleAlphaChange() {
    emit("change");
  }

  /** @param {import("../utils/color.js").Rgba} rgba */
  function pick(rgba) {
    change(
      rgbaToHsva({ ...rgba, a: rgba.a < 1 && alpha ? rgba.a : hsva.a }, hsva.h),
    );
    remember();
  }

  /** @param {CustomEvent<{ color: import("../utils/color.js").Rgba }>} event */
  function handleSwatch(event) {
    // A swatch sets the whole color, alpha included.
    const { color } = event.detail;
    change(rgbaToHsva({ ...color, a: alpha ? color.a : 1 }, hsva.h));
    remember();
  }

  /** @param {CustomEvent<string>} event */
  function handleFormat(event) {
    format = /** @type {ColorPickerFormat} */ (event.detail);
    emit("change");
  }

  // Text fields. Each is bound to its input, so a rejected or clamped
  // entry snaps back when `fields` is rewritten from the color.
  let fields = { hex: "", r: 0, g: 0, b: 0, h: 0, s: 0, l: 0, a: 100 };
  let hexInvalid = false;

  /** @param {ColorPickerColor} color */
  function syncFields(color) {
    const rgba = hsvaToRgba(color);
    const hsla = hsvaToHsla(color);
    fields = {
      hex: formatHex({ ...rgba, a: 1 }),
      r: to8Bit(rgba.r),
      g: to8Bit(rgba.g),
      b: to8Bit(rgba.b),
      h: Math.round(wrapHue(color.h)) % 360,
      s: Math.round(hsla.s),
      l: Math.round(hsla.l),
      a: Math.round(color.a * 100),
    };
    hexInvalid = false;
  }

  $: syncFields(hsva);

  /** @param {string | number | null | undefined} input */
  function readHex(input) {
    const text = String(input ?? "").trim();
    return parseColor(BARE_HEX.test(text) ? `#${text}` : text);
  }

  /** @param {CustomEvent<string | number | null>} event */
  function handleHex(event) {
    const rgba = readHex(event.detail);
    if (!rgba) {
      hexInvalid = true;
      return;
    }
    pick(rgba);
  }

  // While the field shows an error, a value that reads clears it at once.
  // The color still changes on `change`.
  /** @param {CustomEvent<string | number | null>} event */
  function handleHexInput(event) {
    if (hexInvalid && readHex(event.detail)) hexInvalid = false;
  }

  /**
   * @param {"r" | "g" | "b"} channel
   * @param {CustomEvent<number | null>} event
   */
  function handleRgb(channel, event) {
    const next = event.detail;
    if (next == null || Number.isNaN(next)) return syncFields(hsva);
    const rgba = hsvaToRgba(hsva);
    rgba[channel] = Math.min(255, Math.max(0, Math.round(next)));
    change(rgbaToHsva(rgba, hsva.h));
  }

  /**
   * @param {"h" | "s" | "l"} channel
   * @param {CustomEvent<number | null>} event
   */
  function handleHsl(channel, event) {
    const next = event.detail;
    if (next == null || Number.isNaN(next)) return syncFields(hsva);
    const hsla = hsvaToHsla(hsva);
    hsla[channel] =
      channel === "h"
        ? wrapHue(next)
        : Math.min(100, Math.max(0, Math.round(next)));
    change(hslaToHsva(hsla));
  }

  /** @param {CustomEvent<number | null>} event */
  function handleAlphaField(event) {
    const next = event.detail;
    if (next == null || Number.isNaN(next)) return syncFields(hsva);
    change({ ...hsva, a: Math.min(100, Math.max(0, Math.round(next))) / 100 });
  }

  // The eyedropper opens only where the browser has it, so the server and
  // the first client render never show the button.
  let eyeDropperSupported = false;
  /** @type {AbortController | null} */
  let eyeDropperAbort = null;

  onMount(() => {
    eyeDropperSupported =
      typeof (/** @type {any} */ (window).EyeDropper) === "function";
    return () => eyeDropperAbort?.abort();
  });

  async function pickFromScreen() {
    eyeDropperAbort?.abort();
    eyeDropperAbort = new AbortController();
    try {
      const result = await new /** @type {any} */ (window).EyeDropper().open({
        signal: eyeDropperAbort.signal,
      });
      const rgba = parseColor(result.sRGBHex);
      if (rgba) pick({ ...rgba, a: hsva.a });
    } catch {
      // Escape or a closed picker rejects with an AbortError.
    }
  }

  // `current()` reads state inside a function, which `$:` cannot track.
  $: effective = alpha ? hsva : { ...hsva, a: 1 };
  $: rgba = hsvaToRgba(effective);
  $: backgroundColor = background ? parseColor(background) : null;
  $: contrast = backgroundColor ? colorContrast(rgba, backgroundColor) : null;
  $: lowContrast = contrast !== null && contrast < minContrast;
  $: warningId = `${id}-contrast`;
  $: hueName = formatColorName({ h: hsva.h, s: 100, v: 100, a: 1 });
  $: areaText = fill(translateWithId("areaValue"), {
    saturation: Math.round(hsva.s),
    brightness: Math.round(hsva.v),
    color: formatColorName(effective),
  });
  $: hueText = fill(translateWithId("hueValue"), {
    degrees: Math.round(wrapHue(hsva.h)) % 360,
    color: hueName,
  });
  $: alphaText = fill(translateWithId("alphaValue"), {
    alpha: Math.round(hsva.a * 100),
  });
  $: showEyeDropper = eyeDropperSupported && !hideEyeDropper;
  $: showRecent = recentLimit > 0 && recent.length > 0;
</script>

<div
  bind:this={ref}
  role="group"
  {id}
  class:bx--color-picker={true}
  class:bx--color-picker--disabled={disabled}
  style:--ccs-color-picker-rgb="{to8Bit(rgba.r)}, {to8Bit(rgba.g)}, {to8Bit(
    rgba.b,
  )}"
  style:--ccs-color-picker-alpha={effective.a}
  {...wrapperProps}
  aria-label={ariaLabel ??
    (ariaLabelledBy ? undefined : translateWithId("group"))}
  aria-labelledby={ariaLabelledBy}
  aria-describedby={ariaDescribedBy}
>
  <ColorArea
    bind:ref={areaRef}
    hue={hsva.h}
    saturation={hsva.s}
    brightness={hsva.v}
    label={translateWithId("area")}
    roleDescription={translateWithId("areaRoleDescription")}
    valueText={areaText}
    describedBy={lowContrast ? warningId : undefined}
    {disabled}
    on:input={handleArea}
    on:change={handleAreaChange}
    on:commit={remember}
  />

  <div class:bx--color-picker__row={true}>
    <div class:bx--color-picker__preview={true} aria-hidden="true">
      <span class:bx--color-picker__preview-face={true}></span>
    </div>
    {#if showEyeDropper}
      <Button
        kind="ghost"
        size="sm"
        icon={Eyedropper}
        iconDescription={translateWithId("eyeDropper")}
        tooltipPosition="bottom"
        {disabled}
        on:click={pickFromScreen}
      />
    {/if}
    <div class:bx--color-picker__sliders={true}>
      <ColorSlider
        channel="hue"
        max={360}
        value={hsva.h}
        label={translateWithId("hue")}
        valueText={hueText}
        {disabled}
        on:input={handleHue}
        on:change={handleHueChange}
        on:commit={remember}
      />
      {#if alpha}
        <ColorSlider
          channel="alpha"
          value={Math.round(hsva.a * 100)}
          label={translateWithId("alpha")}
          valueText={alphaText}
          {disabled}
          on:input={handleAlpha}
          on:change={handleAlphaChange}
          on:commit={remember}
        />
      {/if}
    </div>
  </div>

  {#if !hideInputs}
    <div class:bx--color-picker__inputs={true}>
      <div class:bx--color-picker__format={true}>
        <Select
          id="{id}-format"
          size="sm"
          hideLabel
          labelText={translateWithId("format")}
          selected={format}
          {disabled}
          on:update={handleFormat}
        >
          <SelectItem value="hex" text="HEX" />
          <SelectItem value="rgb" text="RGB" />
          <SelectItem value="hsl" text="HSL" />
        </Select>
      </div>
      {#if format === "hex"}
        <div
          class:bx--color-picker__field={true}
          class:bx--color-picker__field--wide={true}
        >
          <TextInput
            id="{id}-hex"
            size="sm"
            hideLabel
            labelText={translateWithId("hex")}
            bind:value={fields.hex}
            invalid={hexInvalid}
            invalidText={translateWithId("invalidColor")}
            {disabled}
            spellcheck="false"
            autocomplete="off"
            on:input={handleHexInput}
            on:change={handleHex}
          />
        </div>
      {:else if format === "rgb"}
        {#each RGB_FIELDS as { channel, name, caption } (channel)}
          <div class:bx--color-picker__field={true}>
            <NumberInput
              id="{id}-{channel}"
              size="sm"
              hideLabel
              hideSteppers
              min={0}
              max={255}
              labelText={translateWithId(name)}
              bind:value={fields[channel]}
              {disabled}
              on:change={(event) => handleRgb(channel, event)}
              on:blur={remember}
            />
            <span class:bx--color-picker__caption={true} aria-hidden="true"
              >{caption}</span
            >
          </div>
        {/each}
      {:else}
        {#each HSL_FIELDS as { channel, name, caption, max } (channel)}
          <div class:bx--color-picker__field={true}>
            <NumberInput
              id="{id}-{channel}"
              size="sm"
              hideLabel
              hideSteppers
              min={0}
              {max}
              labelText={translateWithId(name)}
              bind:value={fields[channel]}
              {disabled}
              on:change={(event) => handleHsl(channel, event)}
              on:blur={remember}
            />
            <span class:bx--color-picker__caption={true} aria-hidden="true"
              >{caption}</span
            >
          </div>
        {/each}
      {/if}
      {#if alpha}
        <div class:bx--color-picker__field={true}>
          <NumberInput
            id="{id}-alpha"
            size="sm"
            hideLabel
            hideSteppers
            min={0}
            max={100}
            labelText={translateWithId("alpha")}
            bind:value={fields.a}
            {disabled}
            on:change={handleAlphaField}
            on:blur={remember}
          />
          <span class:bx--color-picker__caption={true} aria-hidden="true"
            >A</span
          >
        </div>
      {/if}
    </div>
  {/if}

  {#if backgroundColor}
    <div id={warningId} role="status" class:bx--color-picker__warning={true}>
      {#if lowContrast}
        <WarningAltFilled size={16} />
        <span>{fill(translateWithId("lowContrast"), { min: minContrast })}</span
        >
      {/if}
    </div>
  {/if}

  {#if swatches.length > 0}
    <ColorSwatches
      {swatches}
      columns={swatchColumns}
      label={translateWithId("swatches")}
      describe={formatColorName}
      selected={rgba}
      {disabled}
      on:select={handleSwatch}
    />
  {/if}

  {#if showRecent}
    <ColorSwatches
      swatches={recent}
      columns={swatchColumns}
      label={translateWithId("recent")}
      describe={formatColorName}
      selected={rgba}
      {disabled}
      on:select={handleSwatch}
    />
  {/if}
</div>
