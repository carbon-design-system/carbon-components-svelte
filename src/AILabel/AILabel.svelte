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
   * Set the kind of AI label.
   * The inline kind renders as text and can show `textLabel` next to it.
   * Inside a `Tag`, the kind is always `"inline"`.
   * @type {"default" | "inline"}
   */
  export let kind = "default";

  /** Specify the AI text in the button */
  export let aiText = "AI";

  /** Specify extra text shown beside the AI text in the inline kind */
  export let textLabel = "";

  /**
   * Specify the ARIA label for the button.
   * It is announced after `aiText`.
   */
  export let ariaLabel = "Show information";

  /**
   * Set to `true` to replace the label with a revert button.
   * Use it after the user edits an AI-generated value.
   * Clicking the revert button sets it back to `false`.
   * @bindable writable
   */
  export let revertActive = false;

  /** Specify the label of the revert button */
  export let revertLabel = "Revert to AI input";

  /**
   * Set to `true` to open the explanation.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the direction of the explanation relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set the alignment of the explanation relative to the button.
   * Defaults to `"end"` inside a field or tile `decorator` slot,
   * otherwise `"start"`.
   * @type {"start" | "center" | "end"}
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
   */
  export let ref = null;

  /**
   * Set an id for the label's toggletip.
   * The explanation id derives from it as `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import { AI_LABEL_HOST_CONTEXT_KEY } from "../constants/context-keys.js";
  import Undo from "../icons/Undo.svelte";
  import Toggletip from "../Toggletip/Toggletip.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /**
   * @type {undefined | {
   *   size: import("svelte/store").Readable<undefined | string>;
   *   state: { set: (value: undefined | "active" | "revert") => void };
   *   labelSize: string | ((kind: "default" | "inline") => string);
   *   labelKind: undefined | "default" | "inline";
   *   labelAlign: "start" | "center" | "end";
   * }}
   */
  const host = getContext(AI_LABEL_HOST_CONTEXT_KEY);
  const hostSize = host?.size;

  $: effectiveKind = host?.labelKind ?? kind;
  $: effectiveSize = host ? hostLabelSize(effectiveKind) : size;
  $: effectiveAlign = align ?? host?.labelAlign ?? "start";
  $: inlineWithContent = effectiveKind === "inline" && !!textLabel;
  $: host?.state.set(revertActive ? "revert" : "active");

  onMount(() => {
    return () => host?.state.set(undefined);
  });

  /** @param {"default" | "inline"} labelKind */
  function hostLabelSize(labelKind) {
    const { labelSize } = host;
    return typeof labelSize === "function" ? labelSize(labelKind) : labelSize;
  }

  function handleRevert() {
    revertActive = false;
    dispatch("revert");
  }
</script>

<div
  class:bx--ai-label={true}
  class:bx--ai-label--revert={revertActive}
  class:bx--ai-label--field-xs={$hostSize === "xs"}
  class:bx--ai-label--inline={effectiveKind === "inline"}
  class:bx--ai-label--inline-with-content={inlineWithContent}
  class:bx--ai-label--mini={effectiveSize === "mini"}
  class:bx--ai-label--2xs={effectiveSize === "2xs"}
  class:bx--ai-label--xs={effectiveSize === "xs"}
  class:bx--ai-label--sm={effectiveSize === "sm"}
  class:bx--ai-label--md={effectiveSize === "md"}
  class:bx--ai-label--lg={effectiveSize === "lg"}
  class:bx--ai-label--xl={effectiveSize === "xl"}
  {...$$restProps}
>
  {#if revertActive}
    <Button
      bind:ref
      kind="ghost"
      size="small"
      iconOnly
      icon={Undo}
      iconDescription={revertLabel}
      tooltipAlignment="end"
      class="bx--ai-label__revert"
      on:click={handleRevert}
    />
  {:else}
    <Toggletip
      bind:open
      bind:ref
      {id}
      {direction}
      align={effectiveAlign}
      {portalTooltip}
      iconDescription={effectiveKind === "inline"
        ? ""
        : `${aiText} ${ariaLabel}`}
      popoverClass="bx--ai-label-popover"
      on:open
      on:close
    >
      <svelte:fragment slot="icon">
        <span class:bx--ai-label__text={true}>{aiText}</span>
        {#if inlineWithContent}
          <span class:bx--ai-label__additional-text={true}>{textLabel}</span>
        {/if}
      </svelte:fragment>
      <slot />
    </Toggletip>
  {/if}
</div>
