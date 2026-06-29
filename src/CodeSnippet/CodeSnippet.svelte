<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @event {null} expand
   * @event {null} collapse
   * @event {null} copy
   * @event {{ error: unknown }} copy:error
   * @event {MouseEvent} mouseenter:copy-button
   * @event {MouseEvent} mouseleave:copy-button
   * @restProps {button | span} Rest props are spread to the span (inline variant) or the copy button (single/multi).
   */

  /**
   * Set the type of code snippet.
   * @type {"single" | "inline" | "multi"}
   */
  export let type = "single";

  /**
   * Set the code snippet text.
   * Alternatively, use the default slot.
   *
   * NOTE: you *must* use the `code` prop for the copy-to-clipboard functionality.
   * @type {string}
   * @example
   * ```svelte
   * <CodeSnippet>{code}</CodeSnippet>
   * ```
   */
  export let code = undefined;

  /**
   * By default, this component uses `navigator.clipboard.writeText` API to copy text to the user's clipboard.
   *
   * Provide a custom function to override this behavior.
   * @type {(code: string) => void | Promise<void>}
   */
  export let copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Set to `true` to expand a multi-line code snippet (type="multi").
   * @bindable writable
   */
  export let expanded = false;

  /** Set to `true` to hide the copy button */
  export let hideCopyButton = false;

  /**
   * Set to `true` for the disabled variant.
   * Only applies to the "single", "multi" types.
   */
  export let disabled = false;

  /**
   * Set to `true` to wrap the text.
   *
   * NOTE: this prop only works with the `type="multi"` variant.
   */
  export let wrapText = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /**
   * Specify the ARIA label for the copy button icon.
   * @type {string}
   */
  export let copyButtonDescription = undefined;

  /**
   * Specify the ARIA label of the copy button.
   * @type {string}
   */
  export let copyLabel = "Copy code";

  /**
   * Specify the ARIA label of the code snippet container (single/multi variants).
   */
  export let codeLabel = "Code snippet";

  /** Specify the feedback text displayed when clicking the snippet */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /**
   * Specify an icon to render on the copy button during the feedback window
   * (e.g. after copying). When unset, the copy icon is always shown.
   *
   * NOTE: this prop does not apply to the `type="inline"` variant.
   * @type {Icon}
   */
  export let feedbackIcon = /** @type {Icon} */ (undefined);

  /**
   * Specify the show less text.
   *
   * NOTE: this prop only works with the `type="multi"` variant.
   */
  export let showLessText = "Show less";

  /**
   * Specify the show more text.
   *
   * NOTE: this prop only works with the `type="multi"` variant.
   */
  export let showMoreText = "Show more";

  /**
   * Set to `false` to hide the show more/less button.
   *
   * NOTE: this prop only works with the `type="multi"` variant.
   * @bindable writable
   */
  export let showMoreLess = true;

  /** Set an id for the code element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the pre HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Obtain a reference to the underlying copy button element. */
  export let copyRef = null;

  /**
   * Set how the "Copied!" feedback tooltip is rendered.
   * By default, it is rendered in a portal so it is never clipped by an
   * `overflow: hidden` container. Set to `false` to use Carbon's inline
   * feedback caret instead.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { createCopyFeedbackState } from "../utils/copyFeedback.js";
  import CodeSnippetSkeleton from "./CodeSnippetSkeleton.svelte";

  const dispatch = createEventDispatcher();

  // Feedback is portalled by default; only an explicit `portalTooltip={false}`
  // opts back into Carbon's inline caret.
  $: effectivePortalTooltip =
    portalTooltip === undefined ? true : portalTooltip;

  const copyFeedback = createCopyFeedbackState(syncCopyFeedback);

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let feedbackOpen = false;
  let copyPending = false;
  let prevExpanded = expanded;
  let exceedsThreshold = false;
  let resizeObserver;

  /**
   * The collapsed (non-expanded) max-height of the snippet, in px.
   * The expand button is only relevant when the content exceeds this.
   */
  const collapsedHeight = 16 * 15;

  function syncCopyFeedback() {
    animation = copyFeedback.animation;
    feedbackOpen = copyFeedback.feedbackOpen;
    copyPending = copyFeedback.copyPending;
  }

  function dismissFeedback() {
    copyFeedback.dismiss();
  }

  function measureHeight() {
    if (!ref) return;
    // Measure the snippet's full (unclipped) content height. The <pre> is never
    // the element with a max-height, so its rendered height always reflects the
    // true content height regardless of expanded state. Comparing the measured
    // height keeps this correct across any consumer font size or line height.
    // Subtract the <pre>'s own vertical padding so only the text counts toward
    // the threshold; otherwise the decorative bottom padding inflates the height
    // and the expand button appears when only padding, not content, is clipped.
    const style = getComputedStyle(ref);
    const padding =
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom);
    const height = ref.getBoundingClientRect().height - padding;
    if (height <= 0) return;
    exceedsThreshold = height > collapsedHeight;
    // If the content no longer overflows, collapse so the expanded min-height
    // doesn't leave the snippet taller than its (now shorter) content.
    if (!exceedsThreshold && expanded) expanded = false;
  }

  $: expandText = expanded ? showLessText : showMoreText;
  $: minHeight = expanded ? collapsedHeight : 48;
  $: maxHeight = expanded ? "none" : `${collapsedHeight}px`;

  // Re-measure whenever the snippet resizes (font load, content change, width
  // change causing reflow), so the expand button only shows on real overflow.
  $: if (resizeObserver) {
    resizeObserver.disconnect();
    if (type === "multi" && showMoreLess && ref) {
      resizeObserver.observe(ref);
    } else {
      exceedsThreshold = false;
    }
  }

  $: showExpandButton = showMoreLess && type === "multi" && exceedsThreshold;

  $: if (type === "multi" && prevExpanded !== expanded) {
    dispatch(expanded ? "expand" : "collapse");
    prevExpanded = expanded;
  }

  let disconnectModalObserver = () => {};

  $: {
    const el = copyRef || ref;
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortalTooltip && el
        ? observeModalClose(el, dismissFeedback)
        : () => {};
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => measureHeight());

    return () => {
      resizeObserver.disconnect();
      copyFeedback.cleanup();
      disconnectModalObserver();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <CodeSnippetSkeleton
    {type}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if type === "inline"}
  {#if hideCopyButton}
    <span
      class:bx--snippet={true}
      class:bx--snippet--expand={expanded}
      class:bx--snippet--light={light}
      class:bx--snippet--no-copy={hideCopyButton}
      class:bx--snippet--wraptext={wrapText}
      class:bx--snippet--single={type === "single"}
      class:bx--snippet--inline={type === "inline"}
      class:bx--snippet--multi={type === "multi"}
      {...$$restProps}
    >
      <code {id}> <slot>{code}</slot> </code>
    </span>
  {:else}
    <button
      bind:this={copyRef}
      type="button"
      aria-live="polite"
      aria-busy={copyPending || undefined}
      class:bx--copy={true}
      class:bx--btn--copy={true}
      class:bx--copy-btn--animating={animation}
      class:bx--copy-btn--fade-in={animation === "fade-in"}
      class:bx--copy-btn--fade-out={animation === "fade-out"}
      class:bx--copy-btn--portal-active={effectivePortalTooltip}
      class:bx--snippet={true}
      class:bx--snippet--inline={type === "inline"}
      class:bx--snippet--expand={expanded}
      class:bx--snippet--light={light}
      class:bx--snippet--wraptext={wrapText}
      aria-label={copyLabel}
      {...$$restProps}
      on:click
      on:click={async () => {
        try {
          await copyFeedback.onClick(
            async () => {
              await copy(code);
              dispatch("copy");
            },
            feedbackTimeout,
            effectivePortalTooltip,
          );
        } catch (error) {
          dispatch("copy:error", { error });
        }
      }}
      on:animationend={(event) => {
        copyFeedback.onAnimationEnd(event);
      }}
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:mouseenter={(event) => dispatch("mouseenter:copy-button", event)}
      on:mouseleave={(event) => dispatch("mouseleave:copy-button", event)}
    >
      <code {id}> <slot>{code}</slot> </code>
      {#if !effectivePortalTooltip}
        <span
          aria-hidden="true"
          class:bx--assistive-text={true}
          class:bx--copy-btn__feedback={true}
        >
          {feedback}
        </span>
      {/if}
    </button>

    {#if effectivePortalTooltip}
      <PortalTooltip anchor={copyRef} open={feedbackOpen} text={feedback} />
    {/if}
  {/if}
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--snippet={true}
    class:bx--snippet--expand={expanded}
    class:bx--snippet--light={light}
    class:bx--snippet--no-copy={hideCopyButton}
    class:bx--snippet--wraptext={wrapText}
    class:bx--snippet--single={type === "single"}
    class:bx--snippet--inline={type === "inline"}
    class:bx--snippet--multi={type === "multi"}
    class:bx--snippet--disabled={type !== "inline" && disabled}
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      role="textbox"
      tabindex={disabled ? undefined : "0"}
      aria-readonly="true"
      aria-multiline={type === "multi" ? "true" : undefined}
      aria-label={$$restProps["aria-label"] ?? codeLabel}
      class:bx--snippet-container={true}
      style:width="100%"
      style:min-height="{minHeight}px"
      style:max-height={maxHeight}
    >
      <pre bind:this={ref}><code><slot>{code}</slot></code></pre>
    </div>
    {#if !hideCopyButton}
      <CopyButton
        bind:ref={copyRef}
        text={code}
        {copy}
        {disabled}
        {feedback}
        {feedbackTimeout}
        {feedbackIcon}
        iconDescription={copyButtonDescription}
        portalTooltip={effectivePortalTooltip}
        on:click
        on:copy
        on:copy:error
        on:animationend
        on:mouseenter={(event) => dispatch("mouseenter:copy-button", event)}
        on:mouseleave={(event) => dispatch("mouseleave:copy-button", event)}
      />
    {/if}
    {#if showExpandButton}
      <Button
        kind="ghost"
        size="small"
        class="bx--snippet-btn--expand"
        {disabled}
        on:click={() => {
          expanded = !expanded;
        }}
      >
        <span class:bx--snippet-btn--text={true}>{expandText}</span>
        <ChevronDown
          class="bx--icon-chevron--down bx--snippet__icon"
          aria-hidden="true"
        />
      </Button>
    {/if}
  </div>
{/if}
