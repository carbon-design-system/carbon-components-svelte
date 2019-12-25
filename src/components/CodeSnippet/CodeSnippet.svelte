<script>
  let className = undefined;
  export { className as class };
  export let type = 'single';
  export let feedback = undefined;
  export let feedbackTimeout = undefined;
  export let copyButtonDescription = undefined;
  export let copyLabel = undefined;
  export let showMoreText = 'Show more';
  export let showLessText = 'Show less';
  export let light = false;
  export let style = undefined;

  import { afterUpdate } from 'svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx } from '../../lib';
  import Button from '../Button';
  import Copy from '../Copy';
  import CopyButton from '../CopyButton';

  const id = Math.random();
  let codeRef = undefined;
  let expanded = false;
  let showMoreLess = false;

  afterUpdate(() => {
    showMoreLess = type === 'multi' && codeRef.getBoundingClientRect().height > 255;
  });

  $: expandText = expanded ? showLessText : showMoreText;
</script>

{#if type === 'inline'}
  <Copy
    aria-label={$$props['aria-label'] || copyLabel}
    aria-describedby={id}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--snippet', type && `--snippet--${type}`, type === 'inline' && '--btn--copy', expanded && '--snippet--expand', light && '--snippet--light', className)}
    {feedback}
    {feedbackTimeout}
    {style}>
    <code {id}>
      <slot />
    </code>
  </Copy>
{:else}
  <div
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--snippet', type && `--snippet--${type}`, type === 'inline' && '--btn--copy', expanded && '--snippet--expand', light && '--snippet--light', className)}
    {style}>
    <div
      role="textbox"
      tabindex="0"
      class={cx('--snippet-container')}
      aria-label={$$props['aria-label'] || copyLabel || 'code-snippet'}>
      <code>
        <pre bind:this={codeRef}>
          <slot />
        </pre>
      </code>
    </div>
    <CopyButton
      on:click
      class={cx('--snippet-button')}
      {feedback}
      {feedbackTimeout}
      iconDescription={copyButtonDescription} />
    {#if showMoreLess}
      <Button
        kind="ghost"
        size="small"
        class={cx('--snippet-btn--expand')}
        on:click={() => {
          expanded = !expanded;
        }}>
        <span class={cx('--snippet-btn--text')}>{expandText}</span>
        <ChevronDown16
          aria-label={expandText}
          class={cx('--icon-chevron--down', '--snippet__icon')} />
      </Button>
    {/if}
  </div>
{/if}
