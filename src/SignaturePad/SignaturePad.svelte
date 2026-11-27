<script>
  /**
   * @typedef {"draw" | "type" | "upload"} SignaturePadMode
   * @typedef {{ type: "drawn" | "typed" | "uploaded"; svg?: string; png?: string; text?: string }} SignaturePadValue
   * @typedef {"modes" | "draw" | "type" | "upload" | "padEmpty" | "padCaptured" | "signHere" | "drawInstructions" | "undo" | "clear" | "undone" | "cleared" | "captured" | "typeLabel" | "typePlaceholder" | "uploadButton" | "uploadInstructions" | "uploadAlt" | "uploadRemove" | "uploadInvalid" | "uploaded"} SignaturePadTranslationId
   * @event {SignaturePadValue | null} change
   * @restProps {div}
   * @slot {{}} labelChildren
   */

  /**
   * The signature, or `null` while there is none. It follows the active
   * mode: drawn strokes, the typed name, or the uploaded picture. Set it to
   * `null` to clear the pad; any other value you set is ignored, because
   * strokes can't be rebuilt from an image.
   * @type {SignaturePadValue | null}
   * @bindable writable
   */
  export let value = null;

  /**
   * Specify the active mode. Bind it to follow the tabs.
   * @type {SignaturePadMode}
   * @bindable writable
   */
  export let mode = "draw";

  /**
   * Specify which ways to sign, in tab order. Keep `"type"`: drawing needs
   * a pointer, and typing is the way for a keyboard or screen reader.
   * @type {ReadonlyArray<SignaturePadMode>}
   */
  export let modes = ["draw", "type"];

  /**
   * Specify the label text.
   * Alternatively, use the named slot "labelChildren".
   */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set to `true` to require a signature. A wrapping `<form>` blocks
   * submission while the pad is empty, and the field shows its invalid
   * state with `requiredInvalidText`.
   */
  export let required = false;

  /**
   * Specify the invalid state text shown when a required pad blocks
   * submission. Cleared once there is a signature. `invalid` and
   * `invalidText` take precedence.
   */
  export let requiredInvalidText = "Add your signature";

  /** Set to `true` to disable the pad */
  export let disabled = false;

  /** Set to `true` to show the signature without letting it change */
  export let readonly = false;

  /**
   * Specify a name attribute for a hidden input that submits the value as
   * JSON, such as `{"type":"drawn","svg":"…"}`.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the hidden input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Specify the shape of the signing area as width over height. The
   * area fills the width it is given.
   */
  export let aspectRatio = 3;

  /**
   * Specify the thinnest line, as a share of a 600-unit-wide pad. The
   * line is thin when the pen moves fast or presses lightly.
   */
  export let minWidth = 0.8;

  /** Specify the thickest line, as a share of a 600-unit-wide pad */
  export let maxWidth = 3.2;

  /**
   * Specify the ink color of the exported SVG and PNG. The pad itself
   * draws in the theme's text color, so a signature on a dark theme is
   * light on screen and still dark in the file.
   */
  export let inkColor = "#161616";

  /**
   * Specify a fill behind the exported image. Exports are transparent
   * unless set.
   * @type {string | undefined}
   */
  export let exportBackground = undefined;

  /**
   * Specify the formats in `value`. A PNG is a data URL, drawn at
   * `pngScale` times the pad's 600-unit width.
   * @type {ReadonlyArray<"svg" | "png">}
   */
  export let formats = ["svg"];

  /** Specify how many pixels the PNG gets per pad unit */
  export let pngScale = 2;

  /**
   * Specify the font stack of a typed signature. The default uses the
   * script fonts that ship with the operating system, so nothing is
   * downloaded. A web font must be loaded before it is measured.
   */
  export let fontFamily =
    '"Snell Roundhand", "Apple Chancery", "Segoe Script", "Lucida Handwriting", "Brush Script MT", cursive';

  /**
   * Override the default text.
   * @type {(id: SignaturePadTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /** Set an id for the pad and its messages */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import ContentSwitcher from "../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../ContentSwitcher/Switch.svelte";
  import SwitchPanel from "../ContentSwitcher/SwitchPanel.svelte";
  import FileUploaderButton from "../FileUploader/FileUploaderButton.svelte";
  import ListBoxRequiredInput from "../ListBox/ListBoxRequiredInput.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Undo from "../icons/Undo.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import {
    createStroke,
    fitFontSize,
    simplify,
    strokePath,
    strokesToSvg,
    textToSvg,
  } from "../utils/signature-path.js";
  import {
    canvasToBlob,
    createTextMeasure,
    loadImageFile,
    rasterize,
  } from "../utils/signature-raster.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** Pad units across. Strokes live in these, so resizing loses nothing. */
  const WIDTH = 600;
  const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  const MAX_NAME_LENGTH = 80;

  const defaultTranslations = {
    modes: "Signature method",
    draw: "Draw",
    type: "Type",
    upload: "Upload",
    padEmpty: "Signature pad, draw your signature",
    padCaptured: "Signature captured",
    signHere: "Sign here",
    drawInstructions:
      "Draw with a mouse, pen or finger. With a keyboard or screen reader, use the Type tab to type your name instead.",
    undo: "Undo",
    clear: "Clear",
    undone: "Last stroke removed",
    cleared: "Signature cleared",
    captured: "Signature captured",
    typeLabel: "Type your name",
    typePlaceholder: "Full name",
    uploadButton: "Choose image",
    uploadInstructions:
      "Upload a PNG, JPEG or WebP picture of your signature on a plain background.",
    uploadAlt: "Uploaded signature",
    uploadRemove: "Remove image",
    uploadInvalid: "Choose a PNG, JPEG or WebP image under 5 MB.",
    uploaded: "Image added",
  };

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;
  $: canEdit = !effectiveDisabled && !readonly;

  const dispatch = createEventDispatcher();

  /** @type {Array<Array<import("../utils/signature-path.js").SignaturePoint>>} */
  let strokes = [];
  /** @type {null | ReturnType<typeof createStroke>} */
  let live = null;
  let liveD = "";
  let frame = 0;
  /** @type {null | DOMRect} */
  let bounds = null;
  /** @type {null | HTMLDivElement} */
  let padRef = null;
  let typed = "";
  /** A PNG data URL of the uploaded picture, normalized on a canvas. */
  let uploaded = "";
  let uploadError = false;
  /** @type {ReadonlyArray<File>} */
  let pickedFiles = [];
  let requiredError = false;
  let announcement = "";
  let announceFlip = false;

  /**
   * @param {string} family
   * @param {number} padHeight
   */
  function fitOptions(family, padHeight) {
    return {
      maxWidth: WIDTH * 0.88,
      maxSize: padHeight * 0.5,
      measure: createTextMeasure(family),
    };
  }

  /**
   * The name to sign with and the size it fits at, read fresh: an `input`
   * handler runs before the reactive `trimmed` and `fontSize` update.
   */
  function typedModel() {
    const text = typed.trim();
    return {
      text,
      fontSize: fitFontSize(text, fitOptions(fontFamily, height)),
    };
  }

  /** @param {SignaturePadTranslationId} key */
  function t(key) {
    return translateWithId(key);
  }

  $: height =
    Math.round((WIDTH / (aspectRatio > 0 ? aspectRatio : 3)) * 100) / 100;
  $: paths = strokes.map(strokePath);
  $: modeList =
    modes.length > 0 ? modes : /** @type {SignaturePadMode[]} */ (["draw"]);
  $: if (!modeList.includes(mode)) mode = modeList[0];
  $: modeIndex = modeList.indexOf(mode);
  $: trimmed = typed.trim();
  $: fontSize = fitFontSize(trimmed, fitOptions(fontFamily, height));
  $: empty = strokes.length === 0 && !live;

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || requiredError || uploadError,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: legendId = `legend-${id}`;
  $: instructionsId = `instructions-${id}`;
  $: hasLabel = !!(labelText || $$slots.labelChildren);
  $: message = invalid
    ? invalidText
    : uploadError
      ? t("uploadInvalid")
      : requiredError
        ? requiredInvalidText
        : "";
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    invalidText: message,
    warnText,
    helperText,
    errorId,
    warnId,
    helperId,
  });
  // The text input shows and describes its own message, so the shared one
  // below the tabs steps aside while it is on screen.
  $: typeShowsMessage = mode === "type";
  $: if (value !== null || !required) requiredError = false;

  /** @type {null | HTMLElement} */
  let focusTarget = null;
  $: {
    const found =
      ref && modeList.length > 1
        ? ref.querySelector(`[id="${id}-switch-${mode}"]`)
        : padRef;
    focusTarget = found ? (found instanceof HTMLElement ? found : null) : null;
  }

  // Svelte 3 and 4 run each `$:` once per update, in dependency order, and
  // follow only assignments they can see in the block. So these two assign
  // `value`, `strokes` and the rest inline, where `empty`, `paths` and the
  // requirement check below can be ordered after them.
  let committedMode = mode;
  $: if (mode !== committedMode) {
    committedMode = mode;
    uploadError = false;
    value = publish();
  }

  let knownValue = value;
  $: if (value !== knownValue) {
    // Only a reset from outside means something: strokes can't be rebuilt
    // from an image, so any other value is left alone.
    if (value === null) {
      strokes = [];
      typed = "";
      uploaded = "";
      uploadError = false;
      live = null;
      liveD = "";
      stopFrame();
    }
    knownValue = value;
  }

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function reset() {
    strokes = [];
    typed = "";
    uploaded = "";
    uploadError = false;
    live = null;
    liveD = "";
    stopFrame();
    commit();
  }

  /** @param {string} text */
  function announce(text) {
    announceFlip = !announceFlip;
    announcement = announceFlip ? text : `${text} `;
  }

  /**
   * What the active mode would draw, or `null` when it is empty.
   * @returns {null | { strokes: import("../utils/signature-path.js").SignaturePoint[][] } | { text: string; fontSize: number; fontFamily: string }}
   */
  function drawable() {
    if (mode === "draw") return strokes.length > 0 ? { strokes } : null;
    if (mode === "type") {
      const { text, fontSize: size } = typedModel();
      return text === "" ? null : { text, fontSize: size, fontFamily };
    }
    return null;
  }

  /**
   * @param {NonNullable<ReturnType<typeof drawable>>} model
   * @param {number} scale
   * @param {string | undefined} background
   */
  function toCanvas(model, scale, background) {
    return rasterize(model, {
      width: WIDTH,
      height,
      scale,
      color: inkColor,
      background,
    });
  }

  /**
   * @param {{ svg: boolean; png: boolean }} want
   * @returns {SignaturePadValue | null}
   */
  function build({ svg, png }) {
    if (mode === "upload") {
      return uploaded ? { type: "uploaded", png: uploaded } : null;
    }
    const model = drawable();
    if (!model) return null;
    /** @type {SignaturePadValue} */
    const result = { type: "strokes" in model ? "drawn" : "typed" };
    if ("text" in model) result.text = model.text;
    if (svg) {
      const options = {
        width: WIDTH,
        height,
        color: inkColor,
        background: exportBackground,
      };
      result.svg =
        "strokes" in model
          ? strokesToSvg(model.strokes, options)
          : textToSvg(model.text, { ...options, ...model });
    }
    if (png) {
      result.png = toCanvas(model, pngScale, exportBackground)?.toDataURL(
        "image/png",
      );
    }
    return result;
  }

  /**
   * Build the active mode's value, tell listeners, and return it. Does not
   * assign `value`; the caller does, in a place Svelte can see.
   * @returns {SignaturePadValue | null}
   */
  function publish() {
    const next = build({
      svg: formats.includes("svg"),
      png: formats.includes("png"),
    });
    if (next === null && value === null) return null;
    knownValue = next;
    dispatch("change", next);
    return next;
  }

  function commit() {
    value = publish();
  }

  // ---- Drawing ----

  /** @param {PointerEvent} event */
  function addSample(event) {
    if (!live || !bounds || bounds.width === 0) return;
    live.add(
      ((event.clientX - bounds.left) / bounds.width) * WIDTH,
      ((event.clientY - bounds.top) / bounds.height) * height,
      {
        pressure: event.pressure,
        time: event.timeStamp,
        pointerType: event.pointerType,
      },
    );
  }

  function flush() {
    frame = 0;
    if (live) liveD = strokePath(live.points);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(flush);
  }

  /** @param {PointerEvent} event */
  function handleDrawStart(event) {
    if (!canEdit || !padRef) return false;
    bounds = padRef.getBoundingClientRect();
    live = createStroke({ minWidth, maxWidth });
    addSample(event);
    flush();
    return true;
  }

  /** @param {PointerEvent} event */
  function handleDrawMove(event) {
    // A fast stroke delivers several samples per event; `pointermove`
    // alone would draw straight lines between the ones the frame kept.
    const samples = event.getCoalescedEvents?.() ?? [];
    if (samples.length > 0) {
      for (const sample of samples) addSample(sample);
    } else {
      addSample(event);
    }
    schedule();
  }

  /** @param {PointerEvent} [event] */
  function handleDrawEnd(event) {
    if (!live) return;
    cancelAnimationFrame(frame);
    frame = 0;
    const points = simplify(live.points);
    live = null;
    liveD = "";
    // The browser took the touch for something else: keep nothing.
    if (event?.type === "pointercancel" || points.length === 0) return;
    const first = strokes.length === 0;
    strokes = [...strokes, points];
    commit();
    if (first) announce(t("captured"));
  }

  /** Remove the last stroke. */
  export function undo() {
    if (!canEdit || strokes.length === 0) return;
    strokes = strokes.slice(0, -1);
    commit();
    announce(strokes.length > 0 ? t("undone") : t("cleared"));
  }

  /** Clear the active mode's signature. */
  export function clear() {
    if (!canEdit) return;
    if (mode === "draw") strokes = [];
    else if (mode === "type") typed = "";
    else {
      uploaded = "";
      uploadError = false;
    }
    commit();
    announce(t("cleared"));
  }

  /**
   * The signature as a standalone SVG document, or `null` when there is
   * none or the active mode is `"upload"`.
   * @returns {string | null}
   */
  export function toSVG() {
    return build({ svg: true, png: false })?.svg ?? null;
  }

  /**
   * The signature as a PNG, or `null` when there is none. `scale` is the
   * pixels per pad unit, `pngScale` by default.
   * @param {{ scale?: number; background?: string }} [options]
   * @returns {Promise<Blob | null>}
   */
  export async function toPNG({
    scale = pngScale,
    background = exportBackground,
  } = {}) {
    if (mode === "upload") {
      return uploaded ? (await fetch(uploaded)).blob() : null;
    }
    const model = drawable();
    const canvas = model && toCanvas(model, scale, background);
    return canvas ? canvasToBlob(canvas) : null;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (
      mode !== "draw" ||
      event.key.toLowerCase() !== "z" ||
      event.shiftKey ||
      event.altKey ||
      !(event.metaKey || event.ctrlKey) ||
      !(event.target instanceof HTMLButtonElement)
    ) {
      return;
    }
    event.preventDefault();
    undo();
  }

  // ---- Typing ----

  /** @param {CustomEvent<string | number | null>} event */
  function handleTypedInput(event) {
    typed = String(event.detail ?? "");
    commit();
  }

  // ---- Uploading ----

  /** @param {CustomEvent<ReadonlyArray<File>>} event */
  async function handleFiles(event) {
    const file = event.detail[0];
    pickedFiles = [];
    if (!file || !canEdit) return;
    uploadError = false;
    if (!ACCEPT.includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
      uploadError = true;
      return;
    }
    try {
      const image = await loadImageFile(file);
      const canvas = rasterize(
        { image },
        { width: WIDTH, height, scale: pngScale, color: inkColor },
      );
      uploaded = canvas ? canvas.toDataURL("image/png") : "";
      uploadError = uploaded === "";
    } catch {
      uploadError = true;
    }
    commit();
    if (uploaded) announce(t("uploaded"));
  }

  /** @param {CustomEvent<number>} event */
  function handleModeChange(event) {
    const next = modeList[event.detail];
    if (next && next !== mode) mode = next;
  }

  function handleFormReset() {
    requiredError = false;
    reset();
  }

  $: padLabel = empty ? t("padEmpty") : t("padCaptured");
</script>

<div
  bind:this={ref}
  class:bx--form-item={true}
  class:bx--signature-pad={true}
  class:bx--signature-pad--disabled={effectiveDisabled}
  class:bx--signature-pad--readonly={readonly}
  use:formReset={handleFormReset}
  {...rest}
>
  <!-- ARIA 1.2 deprecates `aria-invalid` outside the roles that list it, but screen readers still announce it, and the field as a whole is what is invalid. -->
  <!-- svelte-ignore a11y-role-supports-aria-props -->
  <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <fieldset
    use:fieldsetDisabled={(isDisabled) => (inDisabledFieldset = isDisabled)}
    class:bx--signature-pad__fieldset={true}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={joinDescribedBy(describedBy, ariaDescribedBy)}
    aria-invalid={showInvalid || undefined}
    data-invalid={showInvalid || undefined}
    disabled={effectiveDisabled}
    on:keydown={handleKeydown}
  >
    {#if hasLabel}
      <legend
        id={legendId}
        class:bx--label={true}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren">{labelText}</slot>
      </legend>
    {/if}
    <ContentSwitcher
      aria-label={t("modes")}
      selectedIndex={modeIndex}
      on:change={handleModeChange}
      class={modeList.length === 1
        ? "bx--signature-pad__switcher--single"
        : undefined}
    >
      {#each modeList as item (item)}
        <Switch id="{id}-switch-{item}" text={t(item)} />
      {/each}
      <div slot="content" class:bx--signature-pad__panels={true}>
        {#each modeList as item (item)}
          <!-- The panels learn which switch is selected after the switches register, so on the server and in the first render they are all hidden. Say which one is open. -->
          <SwitchPanel
            id="{id}-panel-{item}"
            hidden={item === mode ? undefined : ""}
          >
            {#if item === "draw"}
              <div class:bx--signature-pad__draw={true}>
                <div
                  bind:this={padRef}
                  role="img"
                  class:bx--signature-pad__surface={true}
                  class:bx--signature-pad__pad={true}
                  class:bx--signature-pad__surface--empty={empty}
                  class:bx--signature-pad__surface--invalid={showInvalid}
                  aria-label={padLabel}
                  aria-describedby={instructionsId}
                  use:pointerDrag={{
                    enabled: canEdit,
                    onStart: handleDrawStart,
                    onMove: handleDrawMove,
                    onEnd: handleDrawEnd,
                  }}
                >
                  <svg
                    class:bx--signature-pad__canvas={true}
                    viewBox="0 0 {WIDTH} {height}"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {#each paths as d, index (index)}
                      <path class:bx--signature-pad__ink={true} {d} />
                    {/each}
                    {#if liveD}
                      <path class:bx--signature-pad__ink={true} d={liveD} />
                    {/if}
                  </svg>
                  {#if empty}
                    <span class:bx--signature-pad__placeholder={true}
                      >{t("signHere")}</span
                    >
                  {/if}
                </div>
                <p
                  id={instructionsId}
                  class:bx--signature-pad__instructions={true}
                >
                  {t("drawInstructions")}
                </p>
                <div class:bx--signature-pad__actions={true}>
                  <Button
                    kind="ghost"
                    size="sm"
                    icon={Undo}
                    class="bx--signature-pad__undo"
                    disabled={!canEdit || strokes.length === 0}
                    on:click={undo}>{t("undo")}</Button
                  >
                  <Button
                    kind="ghost"
                    size="sm"
                    disabled={!canEdit || strokes.length === 0}
                    on:click={clear}>{t("clear")}</Button
                  >
                </div>
              </div>
            {:else if item === "type"}
              <div class:bx--signature-pad__type={true}>
                <TextInput
                  id="{id}-name"
                  labelText={t("typeLabel")}
                  placeholder={t("typePlaceholder")}
                  value={typed}
                  disabled={effectiveDisabled}
                  {readonly}
                  invalid={typeShowsMessage && showInvalid}
                  invalidText={message}
                  warn={typeShowsMessage && showWarn}
                  {warnText}
                  autocomplete="off"
                  autocapitalize="words"
                  spellcheck="false"
                  maxlength={MAX_NAME_LENGTH}
                  on:input={handleTypedInput}
                />
                <!-- The input above carries the text; this is how it will look. -->
                <div class:bx--signature-pad__surface={true}>
                  <svg
                    class:bx--signature-pad__canvas={true}
                    viewBox="0 0 {WIDTH} {height}"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <text
                      class:bx--signature-pad__ink={true}
                      x={WIDTH / 2}
                      y={height / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-family={fontFamily}
                      font-size={fontSize}>{trimmed}</text
                    >
                  </svg>
                </div>
              </div>
            {:else}
              <div class:bx--signature-pad__upload={true}>
                {#if uploaded}
                  <div class:bx--signature-pad__surface={true}>
                    <img
                      class:bx--signature-pad__image={true}
                      src={uploaded}
                      alt={t("uploadAlt")}
                    />
                  </div>
                  <div class:bx--signature-pad__actions={true}>
                    <Button
                      kind="ghost"
                      size="sm"
                      disabled={!canEdit}
                      on:click={clear}>{t("uploadRemove")}</Button
                    >
                  </div>
                {:else}
                  <p class:bx--signature-pad__instructions={true}>
                    {t("uploadInstructions")}
                  </p>
                  <FileUploaderButton
                    id="{id}-file"
                    kind="tertiary"
                    labelText={t("uploadButton")}
                    accept={ACCEPT}
                    disabled={!canEdit}
                    disableLabelChanges
                    bind:files={pickedFiles}
                    on:change={handleFiles}
                  />
                {/if}
              </div>
            {/if}
          </SwitchPanel>
        {/each}
      </div>
    </ContentSwitcher>
    {#if showInvalid && !typeShowsMessage}
      <div class:bx--signature-pad__validation-msg={true}>
        <WarningFilled class="bx--signature-pad__invalid-icon" />
        {#if message}
          <div
            id={errorId}
            role="alert"
            class:bx--form-requirement={true}
            class:bx--form-requirement--invalid={true}
          >
            {message}
          </div>
        {/if}
      </div>
    {:else if showWarn && !typeShowsMessage}
      <div class:bx--signature-pad__validation-msg={true}>
        <WarningAltFilled
          class="bx--signature-pad__invalid-icon bx--signature-pad__invalid-icon--warning"
        />
        {#if warnText}
          <div
            id={warnId}
            class:bx--form-requirement={true}
            class:bx--form-requirement--warn={true}
          >
            {warnText}
          </div>
        {/if}
      </div>
    {/if}
  </fieldset>
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
  <div class:bx--visually-hidden={true} role="status" aria-live="polite">
    {announcement}
  </div>
  {#if name}
    <input
      type="hidden"
      {name}
      {form}
      value={value === null ? "" : JSON.stringify(value)}
      disabled={effectiveDisabled}
    />
  {/if}
  {#if required}
    <ListBoxRequiredInput
      hasValue={value !== null}
      disabled={effectiveDisabled}
      {readonly}
      {focusTarget}
      {form}
      on:invalid={() => (requiredError = true)}
      on:reset={() => (requiredError = false)}
    />
  {/if}
</div>
