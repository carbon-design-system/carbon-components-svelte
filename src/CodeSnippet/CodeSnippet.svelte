<script>
  export let type = "single"; // "single" | "inline" | "multi"
  export let code = undefined;
  export let light = false;
  export let skeleton = false;
  export let copyButtonDescription = undefined;
  export let copyLabel = undefined;
  export let feedback = "Copied!";
  export let feedbackTimeout = 2000;
  export let showLessText = "Show less";
  export let showMoreText = "Show more";
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { afterUpdate } from "svelte";
  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";
  import { Button } from "../Button";
  import { Copy } from "../Copy";
  import { CopyButton } from "../CopyButton";
  import CodeSnippetSkeleton from "./CodeSnippet.Skeleton.svelte";

  $: showMoreLess = false;
  $: expanded = false;
  $: expandText = expanded ? showLessText : showMoreText;

  afterUpdate(() => {
    if (type === "multi" && ref) {
      showMoreLess = ref.getBoundingClientRect().height > 255;
    }
  });
</script>

{#if skeleton}
  <CodeSnippetSkeleton {type} {...$$restProps} />
{:else}
  {#if type === 'inline'}
    <Copy
      aria-label={copyLabel}
      aria-describedby={id}
      class="bx--snippet {type && `bx--snippet--${type}`}
      {type === 'inline' && 'bx--btn--copy'}
      {expanded && 'bx--snippet--expand'}
      {light && 'bx--snippet--light'}"
      {...$$restProps}
      on:clicks
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
