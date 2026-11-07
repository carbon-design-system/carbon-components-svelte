<script>
  /**
   * @event {null} open
   * @event {null} close
   * @event {null} revert
   * @restProps {div}
   */

  /**
   * Set the size of the button.
   * Inside a component's `decorator` slot, the component sets the size:
   * `"mini"` in fields, checkboxes, and radio buttons, and `"xs"` in tiles.
   * @type {"mini" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl"}
   */
  export let size = "xs";

  /**
   * Set the form of the label.
   * The inline variant renders as text and can show `labelText` next to it.
   * Inside a `Tag`, the variant is always `"inline"`.
   * @type {"default" | "inline"}
   */
  export let variant = "default";

  /** Specify the AI text in the button */
  export let aiText = "AI";

  /** Specify extra text shown beside the AI text in the inline variant */
  export let labelText = "";

  /**
   * Specify the text that screen readers hear after `aiText`.
   * The inline variant is named by its visible text and ignores it.
   */
  export let iconDescription = "Show information";

  /**
   * Set to `true` after the user edits an AI-generated value.
   * The label turns into a revert button.
   * Clicking the revert button sets it back to `false`.
   * @bindable writable
   */
  export let edited = false;

  /** Specify the tooltip text of the revert button */
  export let revertText = "Revert to AI input";

  /**
   * Set to `true` to open the explanation.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set where the explanation opens: the side of the button, then its
   * alignment along that side.
   * Above and below the button, `start` and `end` name inline sides, so
   * they swap under `dir="rtl"`.
   * Defaults to `"bottom-end"` inside a field or tile `decorator` slot,
   * otherwise `"bottom-start"`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let align = undefined;

  /**
   * Set to `true` to render the explanation in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the explanation is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Set an id for the label's toggletip.
   * The explanation id derives from it as `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Toggletip from "../Toggletip/Toggletip.svelte";
  import { AI_LABEL_HOST_CONTEXT_KEY } from "../constants/context-keys.js";
  import Undo from "../icons/Undo.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /**
   * @type {undefined | {
   *   size: import("svelte/store").Readable<undefined | string>;
   *   state: { set: (value: undefined | "active" | "revert") => void };
   *   labelSize: string | ((variant: "default" | "inline") => string);
   *   labelVariant: undefined | "default" | "inline";
   *   labelAlign: "start" | "center" | "end";
   * }}
   */
  const host = getContext(AI_LABEL_HOST_CONTEXT_KEY);
  const hostSize = host?.size;

  $: effectiveVariant = host?.labelVariant ?? variant;
  $: effectiveSize = host ? hostLabelSize(effectiveVariant) : size;
  $: [direction, alignment] = splitPlacement(
    align ?? `bottom-${host?.labelAlign ?? "start"}`,
  );
  $: inlineWithContent = effectiveVariant === "inline" && !!labelText;
  $: host?.state.set(edited ? "revert" : "active");
  // The revert button replaces the Toggletip, so the explanation
  // would otherwise reappear open once the label is restored.
  $: if (edited) open = false;

  onMount(() => {
    return () => host?.state.set(undefined);
  });

  /**
   * Toggletip takes the side and the alignment as two props.
   * @param {string} placement
   * @returns {["top" | "right" | "bottom" | "left", "start" | "center" | "end"]}
   */
  function splitPlacement(placement) {
    const [side, along = "center"] = placement.split("-");
    return /** @type {any} */ ([side, along]);
  }

  /** @param {"default" | "inline"} labelVariant */
  function hostLabelSize(labelVariant) {
    const { labelSize } = /** @type {NonNullable<typeof host>} */ (host);
    return typeof labelSize === "function"
      ? labelSize(labelVariant)
      : labelSize;
  }

  /** @param {MouseEvent} event */
  async function handleRevert(event) {
    edited = false;
    dispatch("revert");
    // The revert button unmounts with the click. A keyboard press
    // (`detail` 0) would drop focus on the body, so move it to the label.
    // A pointer click leaves it, as Carbon React does, since the label
    // would show its focus ring.
    if (event.detail !== 0) return;
    await tick();
    ref?.focus();
  }

  // Rest props go on the root, but naming and description belong on the
  // button.
  $: ({
    ariaLabel: consumerLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
</script>

<div
  class:bx--ai-label={true}
  class:bx--ai-label--revert={edited}
  class:bx--ai-label--field-xs={$hostSize === "xs"}
  class:bx--ai-label--inline={effectiveVariant === "inline"}
  class:bx--ai-label--inline-with-content={inlineWithContent}
  class:bx--ai-label--mini={effectiveSize === "mini"}
  class:bx--ai-label--2xs={effectiveSize === "2xs"}
  class:bx--ai-label--xs={effectiveSize === "xs"}
  class:bx--ai-label--sm={effectiveSize === "sm"}
  class:bx--ai-label--md={effectiveSize === "md"}
  class:bx--ai-label--lg={effectiveSize === "lg"}
  class:bx--ai-label--xl={effectiveSize === "xl"}
  {...wrapperProps}
>
  {#if edited}
    <Button
      bind:ref
      kind="ghost"
      size="small"
      iconOnly
      icon={Undo}
      iconDescription={revertText}
      tooltipAlignment="end"
      class="bx--ai-label__revert"
      aria-label={consumerLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      on:click={handleRevert}
    />
  {:else}
    <Toggletip
      bind:open
      bind:ref
      {id}
      {direction}
      align={alignment}
      {portalTooltip}
      iconDescription={effectiveVariant === "inline"
        ? ""
        : `${aiText} ${iconDescription}`}
      popoverClass="bx--ai-label-popover"
      aria-label={consumerLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      on:open
      on:close
    >
      <svelte:fragment slot="icon">
        <span class:bx--ai-label__text={true}>{aiText}</span>
        {#if inlineWithContent}
          <span class:bx--ai-label__additional-text={true}>{labelText}</span>
        {/if}
      </svelte:fragment>
      <slot />
    </Toggletip>
  {/if}
</div>
