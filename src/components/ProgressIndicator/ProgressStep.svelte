<script>
  let className = undefined;
  export { className as class };
  export let label = '';
  export let current = false;
  export let complete = false;
  export let description = '';
  export let invalid = false;
  export let secondaryLabel = '';
  export let disabled = false;
  export let style = undefined;

  import { getContext } from 'svelte';
  import Warning16 from 'carbon-icons-svelte/lib/Warning16';
  import CheckmarkOutline16 from 'carbon-icons-svelte/lib/CheckmarkOutline16';
  import { cx } from '../../lib';

  const id = Math.random();
  const { stepsById, add, change } = getContext('ProgressIndicator');

  add({ id, disabled });

  $: step = $stepsById[id];
  $: {
    current = step.current;
    complete = step.complete;
  }
</script>

<li
  aria-disabled={disabled}
  class={cx('--progress-step', current && '--progress-step--current', complete && '--progress-step--complete', !complete && !current && '--progress-step--incomplete', disabled && '--progress-step--disabled', className)}
  {style}>
  <div
    role="button"
    tabindex={current ? '-1' : '0'}
    class={cx('--progress-step-button', current && '--progress-step-button--unclickable')}
    on:click={() => {
      change(step.index);
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={event => {
      if (event.key === ' ' || event.key === 'Enter') {
        change(step.index);
      }
    }}>
    {#if invalid}
      <Warning16 class={cx('--progress__warning')} />
    {:else if current}
      <svg>
        <path d="M 7, 7 m -7, 0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0" />
        <title>{description}</title>
      </svg>
    {:else if complete}
      <CheckmarkOutline16 title={description} />
    {:else}
      <svg>
        <title>{description}</title>
        <path
          d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3 0-6-2.7-6-6s2.7-6 6-6 6
          2.7 6 6-2.7 6-6 6z" />
      </svg>
    {/if}
    <slot props={{ class: cx('--progress-label') }}>
      <p class={cx('--progress-label')}>{label}</p>
    </slot>
    {#if secondaryLabel}
      <p class={cx('--progress-optional')}>{secondaryLabel}</p>
    {/if}
    <span class={cx('--progress-line')} />
  </div>
</li>
