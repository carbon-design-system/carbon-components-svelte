<script>
  /**
   * One token in the `ThemeBuilder` editor: a color swatch, a text field, and
   * a reset button. Internal to `ThemeBuilder`.
   */

  /**
   * @event {{ token: string; value: string }} change
   * @event {{ token: string }} reset
   */

  /**
   * Token name, such as `layer-01`.
   * @type {string}
   */
  export let token;

  /**
   * The value the token has now, as a CSS color or `var(--cds-token)`.
   * @type {string}
   */
  export let value;

  /**
   * The color to paint, with any `var(--cds-token)` already followed.
   * @type {string}
   */
  export let shown = value;

  /**
   * How the token got its value. `undefined` means the base theme's.
   * @type {"override" | "derived" | "alias" | undefined}
   */
  export let source = undefined;

  /**
   * Specify an id. The field and tag ids derive from it.
   * @type {string}
   */
  export let id;

  /** Text for the reset button. */
  export let resetLabel = "Reset";

  import { createEventDispatcher } from "svelte";
  import Tag from "../Tag/Tag.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { parseColor } from "./color.js";
  import { normalizeValue } from "./theme-model.js";

  const dispatch = createEventDispatcher();

  let draft = value;
  let focused = false;

  // An outside change (reset, import, derivation) replaces the draft; typing
  // never does, so a half-typed color is not rewritten under the cursor.
  $: if (!focused) draft = value;

  $: normalized = normalizeValue(draft);
  $: invalid = draft.trim() !== "" && normalized === null;

  // The native color input is opaque `#rrggbb`. A translucent token or an
  // alias gets a plain swatch and its text field.
  $: opaque = parseColor(shown);
  $: pickable = opaque !== null && opaque.a === 1 && !value.startsWith("var(");
  $: hex = pickable ? toHex6(shown) : "#000000";

  /** @param {string} color */
  function toHex6(color) {
    const rgba = parseColor(color);
    if (!rgba) return "#000000";
    return `#${[rgba.r, rgba.g, rgba.b]
      .map((n) =>
        Math.round(n * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }

  /** @param {string} next */
  function commit(next) {
    if (next !== value) dispatch("change", { token, value: next });
  }

  /** @param {CustomEvent<string | number | null>} event */
  function onInput(event) {
    draft = String(event.detail ?? "");
    const next = normalizeValue(draft);
    if (next) commit(next);
  }

  /** @param {Event} event */
  function onPick(event) {
    const next = /** @type {HTMLInputElement} */ (event.currentTarget).value;
    draft = next;
    commit(next);
  }

  function onReset() {
    focused = false;
    dispatch("reset", { token });
  }
</script>

<div
  class="bx--theme-builder__token"
  class:bx--theme-builder__token--changed={source !== undefined}
>
  {#if pickable}
    <input
      type="color"
      class="bx--theme-builder__swatch"
      value={hex}
      aria-label="{token} color picker"
      on:input={onPick}
    />
  {:else}
    <span
      class="bx--theme-builder__swatch bx--theme-builder__swatch--static"
      style="background-color: {shown}"
      aria-hidden="true"
    ></span>
  {/if}
  <div class="bx--theme-builder__token-field">
    <TextInput
      {id}
      size="sm"
      labelText={token}
      value={draft}
      {invalid}
      invalidText="Use #rrggbb, rgb(), rgba(), or var(--cds-token)."
      spellcheck={false}
      on:input={onInput}
      on:focus={() => (focused = true)}
      on:blur={() => {
        focused = false;
        if (invalid) draft = value;
      }}
    />
  </div>
  <div class="bx--theme-builder__token-state">
    {#if source === "derived" || source === "alias"}
      <Tag id="{id}-state" size="sm" type="gray">
        {source === "derived" ? "Derived" : "Follows"}
      </Tag>
    {:else if source === "override"}
      <Tag id="{id}-state" size="sm" type="blue">Edited</Tag>
      <button
        type="button"
        class="bx--theme-builder__reset"
        aria-label="{resetLabel} {token}"
        on:click={onReset}
      >
        {resetLabel}
      </button>
    {/if}
  </div>
</div>
