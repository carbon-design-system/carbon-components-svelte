<script>
  /**
   * @event {null} expand
   * @event {null} collapse
   * @event {null} copy
   */

  /**
   * Set the type of code snippet
   * @type {"single" | "inline" | "multi"}
   */
  export let type = "single";

  /**
   * Set the code snippet text.
   * Alternatively, use the default slot (e.g., `<CodeSnippet>{code}</CodeSnippet>`).
   *
   * NOTE: you *must* use the `code` prop for the copy-to-clipboard functionality.
   * @type {string}
   */
  export let code = undefined;

  /**
   * By default, this component uses `navigator.clipboard.writeText` API to copy text to the user's clipboard.
   *
   * Provide a custom function to override this behavior.
   * @type {(code: string) => void}
   */
  export let copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      console.log(e);
    }
  };

  /** Set to `true` to expand a multi-line code snippet (type="multi") */
  export let expanded = false;

  /** Set to `true` to hide the copy button */
  export let hideCopyButton = false;

  /**
   * Set to `true` for the disabled variant.
   * Only applies to the "single", "multi" types
   */
  export let disabled = false;

  /**
   * Set to `true` to wrap the text.
   *
   * NOTE: this prop only works with the `type="multi"` variant
   */
  export let wrapText = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /**
   * Specify the ARIA label for the copy button icon
   * @type {string}
   */
  export let copyButtonDescription = undefined;

  /**
   * Specify the ARIA label of the copy button
   * @type {string}
   */
  export let copyLabel = undefined;

  /** Specify the feedback text displayed when clicking the snippet */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /**
   * Specify the show less text.
   *
   * NOTE: this prop only works with the `type="multi"` variant
   */
  export let showLessText = "Show less";

  /**
   * Specify the show more text
   *
   * NOTE: this prop only works with the `type="multi"` variant
   */
  export let showMoreText = "Show more";

  /**
   * Set to `false` to hide the show more/less button
   *
   * NOTE: this prop only works with the `type="multi"` variant
   */
  export let showMoreLess = true;

  /** Set an id for the code element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the pre HTML element */
  export let ref = null;

  import { createEventDispatcher, tick, onMount } from "svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import CodeSnippetSkeleton from "./CodeSnippetSkeleton.svelte";

  const dispatch = createEventDispatcher();

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let timeout = undefined;

  function setShowMoreLess() {
    const { height } = ref.getBoundingClientRect();
    if (height > 0) showMoreLess = ref.getBoundingClientRect().height > 255;
  }

  $: expandText = expanded ? showLessText : showMoreText;
  $: minHeight = expanded ? 16 * 15 : 48;
  $: maxHeight = expanded ? "none" : 16 * 15 + "px";

  // Show more/less only applies to multi-line code snippets
  $: if (type !== "multi") showMoreLess = false;

  $: if (type === "multi" && ref) {
    if (showMoreLess) {
      // Only compute the show more/less button if the consumer has not opted out
      if (code === undefined) setShowMoreLess();
      if (code) tick().then(setShowMoreLess);
    }
  }

  $: if (type === "multi") dispatch(expanded ? "expand" : "collapse");

  onMount(() => {
    return () => clearTimeout(timeout);
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
      <code {id}>
        <slot>{code}</slot>
      </code>
    </span>
  {:else}
    <button
      type="button"
      aria-live="polite"
      class:bx--copy={true}
      class:bx--btn--copy={true}
      class:bx--copy-btn--animating={animation}
      class:bx--copy-btn--fade-in={animation === "fade-in"}
      class:bx--copy-btn--fade-out={animation === "fade-out"}
      class:bx--snippet={true}
      class:bx--snippet--inline={type === "inline"}
      class:bx--snippet--expand={expanded}
      class:bx--snippet--light={light}
      class:bx--snippet--wraptext={wrapText}
      aria-label={copyLabel}
      {...$$restProps}
      on:click
      on:click={() => {
        copy(code);
        dispatch("copy");
        if (animation === "fade-in") return;
        animation = "fade-in";
        timeout = setTimeout(() => {
          animation = "fade-out";
        }, feedbackTimeout);
      }}
      on:animationend={({ animationName }) => {
        if (animationName === "hide-feedback") {
          animation = undefined;
        }
      }}
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      <code {id}>
        <slot>{code}</slot>
      </code>
      <span
        aria-hidden="true"
        class:bx--assistive-text={true}
        class:bx--copy-btn__feedback={true}
      >
        {feedback}
      </span>
    </button>
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
      role={type === "single" ? "textbox" : undefined}
      tabindex={type === "single" && !disabled ? "0" : undefined}
      aria-label={$$restProps["aria-label"] || copyLabel || "code-snippet"}
      class:bx--snippet-container={true}
      style:width="100%"
      style:min-height="{minHeight}px"
      style:max-height={maxHeight}
    >
      <pre bind:this={ref}><code><slot>{code}</slot></code></pre>
    </div>
    {#if !hideCopyButton}
      <CopyButton
        text={code}
        {copy}
        {disabled}
        {feedback}
        {feedbackTimeout}
        iconDescription={copyButtonDescription}
        on:click
        on:copy
        on:animationend
      />
    {/if}
    {#if showMoreLess}
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
          aria-label={expandText}
        />
      </Button>
    {/if}
  </div>
{/if}
