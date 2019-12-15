<script>
  let className = undefined;
  export { className as class };
  export let type = 'single';
  export let feedback = undefined;
  export let copyButtonDescription = undefined;
  export let copyLabel = undefined;
  export let showMoreText = 'Show more';
  export let showLessText = 'Show less';
  export let light = false;
  export let props = {};

  import { onMount } from 'svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx } from '../../lib';
  import Button from '../Button';
  import Copy from '../Copy';
  import CopyButton from '../CopyButton';

  const id = Math.random();
  let codeRef = undefined;
  let expandedCode = false;
  let shouldShowMoreLessBtn = false;

  onMount(() => {
    if (codeRef) {
      const { height } = codeRef.getBoundingClientRect();
      shouldShowMoreLessBtn = type === 'multi' && height > 255;
    }
  });

  $: _class = cx(
    '--snippet',
    type && `--snippet--${type}`,
    expandedCode && '--snippet--expand',
    light && '--snippet--light',
    className
  );
  $: expandCodeBtnText = expandedCode ? showLessText : showMoreText;
</script>

{#if type === 'inline'}
  <Copy
    on:click
    aria-label={copyLabel || $$props['aria-label']}
    aria-describedby={id}
    class={_class}
    {feedback}
    {props}>
    <code {id}>
      <slot />
    </code>
  </Copy>
{:else}
  <div {...props} class={_class}>
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
    <CopyButton on:click {feedback} iconDescription={copyButtonDescription} />
    {#if shouldShowMoreLessBtn}
      <Button
        kind="ghost"
        size="small"
        class={cx('--snippet-btn--expand')}
        on:click={() => {
          expandedCode = !expandedCode;
        }}>
        <span class={cx('--snippet-btn--text')}>{expandCodeBtnText}</span>
        <ChevronDown16
          aria-label={expandCodeBtnText}
          class={cx('--icon-chevron--down', '--snippet__icon')} />
      </Button>
    {/if}
  </div>
{/if}
