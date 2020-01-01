<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let filter = false;
  export let style = undefined;
  export let title = 'Clear filter';
  export let type = undefined;

  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import { cx } from '../../lib';
  import { TYPES } from './constants';
</script>

<span
  tabindex={filter ? '0' : undefined}
  title={filter ? title : undefined}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--tag', type && `--tag--${type}`, disabled && '--tag--disabled', filter && '--tag--filter', className)}
  {style}>
  <slot>{TYPES[type]}</slot>
  {#if filter}
    <Close16 aria-label={title} />
  {/if}
</span>
