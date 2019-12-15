<script>
  let className = undefined;
  export { className as class };
  export let type = undefined;
  export let disabled = false;
  export let filter = false;
  export let title = 'Clear filter';
  export let props = {};

  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import { cx } from '../../lib';
  import { TYPES } from './constants';

  const _class = cx(
    '--tag',
    type && `--tag--${type}`,
    disabled && '--tag--disabled',
    filter && '--tag--filter',
    className
  );
</script>

{#if filter}
  <span
    {...props}
    tabindex="0"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={_class}
    {title}>
    <slot>{TYPES[type]}</slot>
    <Close16 aria-label={title} />
  </span>
{:else}
  <span {...props} on:click on:mouseover on:mouseenter on:mouseleave class={_class}>
    <slot>{TYPES[type]}</slot>
  </span>
{/if}
