<script>
  /**
   * Set the type of code snippet
   * @type {"single" | "inline" | "multi"} [type="single"]
   */
  export let type = "single";

  /**
   * Set the code snippet text
   * Alternatively, use the default slot (e.g. <CodeSnippet>{`code`}</CodeSnippet>)
   * @type {string} [code]
   */
  export let code = undefined;

  /**
   * Set to `true` to expand a multi-line code snippet (type="multi")
   * @type {boolean} [expanded=false]
   */
  export let expanded = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to display the skeleton state
   * @type {boolean} [skeleton=false]
   */
  export let skeleton = false;

  /**
   * Specify the ARIA label for the copy button icon
   * @type {string} [copyButtonDescription]
   */
  export let copyButtonDescription = undefined;

  /**
   * Specify the ARIA label of the copy button
   * @type {string} [copyLabel]
   */
  export let copyLabel = undefined;

  /**
   * Specify the feedback text displayed when clicking the snippet
   * @type {string} [feedback="Copied!"]
   */
  export let feedback = "Copied!";

  /**
   * Set the timeout duration (ms) to display feedback text
   * @type {number} [feedbackTimeout=2000]
   */
  export let feedbackTimeout = 2000;

  /**
   * Specify the show less text
   * `type` must be "multi"
   * @type {string} [showLessText="Show less"]
   */
  export let showLessText = "Show less";

  /**
   * Specify the show more text
   * `type` must be "multi"
   * @type {string} [showLessText="Show more"]
   */
  export let showMoreText = "Show more";

  /**
   * Set to `true` to enable the show more/less button
   * @type {boolean} [showMoreLess=false]
   */
  export let showMoreLess = false;

  /**
   * Set an id for the code element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the pre HTML element
   * @type {null | HTMLPreElement} [ref=null]
   */
  export let ref = null;

  import { afterUpdate } from "svelte";
  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";
  import { Button } from "../Button";
  import { Copy } from "../Copy";
  import { CopyButton } from "../CopyButton";
  import CodeSnippetSkeleton from "./CodeSnippet.Skeleton.svelte";

  $: expandText = expanded ? showLessText : showMoreText;

  afterUpdate(() => {
    if (type === "multi" && ref) {
      showMoreLess = ref.getBoundingClientRect().height > 255;
    }
  });
</script>

{#if skeleton}
  <CodeSnippetSkeleton
    {type}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  {#if type === 'inline'}
    <Copy
      aria-label={copyLabel}
      aria-describedby={id}
      {feedback}
      {feedbackTimeout}
      class="bx--snippet {type && `bx--snippet--${type}`}
      {type === 'inline' && 'bx--btn--copy'}
      {expanded && 'bx--snippet--expand'}
      {light && 'bx--snippet--light'}"
      {...$$restProps}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave>
      <code {id}>
        <slot>{code}</slot>
      </code>
    </Copy>
  {:else}
    <div
      class:bx--snippet={true}
      class={type && `bx--snippet--${type}`}
      class:bx--btn--copy={type === 'inline'}
      class:bx--snippet--expand={expanded}
      class:bx--snippet--light={light}
      {...$$restProps}
      on:mouseover
      on:mouseenter
      on:mouseleave>
      <div
        role={type === 'single' ? 'textbox' : undefined}
        tabindex={type === 'single' ? '0' : undefined}
        class:bx--snippet-container={true}
        aria-label={$$restProps['aria-label'] || copyLabel || 'code-snippet'}>
        <code>
          <pre bind:this={ref}>
            <slot>{code}</slot>
          </pre>
        </code>
      </div>
      <CopyButton
        {feedback}
        {feedbackTimeout}
        iconDescription={copyButtonDescription}
        on:click
        on:animationend />
      {#if showMoreLess}
        <Button
          kind="ghost"
          size="small"
          class="bx--snippet-btn--expand"
          on:click={() => {
            expanded = !expanded;
          }}>
          <span class:bx--snippet-btn--text={true}>{expandText}</span>
          <ChevronDown16
            class="bx--icon-chevron--down bx--snippet__icon"
            aria-label={expandText} />
        </Button>
      {/if}
    </div>
  {/if}
{/if}
