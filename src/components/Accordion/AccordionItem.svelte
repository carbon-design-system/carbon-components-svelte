<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = 'Expand/Collapse';
  export let open = false;
  export let style = undefined;
  export let title = undefined;

  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { cx } from '../../lib';

  let animation = undefined;
</script>

<li
  class={cx('--accordion__item', open && '--accordion__item--active', animation && `--accordion__item--${animation}`, className)}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}
  {style}>
  <button
    type="button"
    class={cx('--accordion__heading')}
    title={iconDescription}
    aria-expanded={open}
    on:click
    on:click={() => {
      open = !open;
      animation = open ? 'expanding' : 'collapsing';
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={({ key }) => {
      if (open && key === 'Escape') {
        open = false;
      }
    }}>
    <ChevronRight16 class={cx('--accordion__arrow')} aria-label={iconDescription} />
    <div class={cx('--accordion__title')}>
      <slot name="title">{title}</slot>
    </div>
  </button>
  <div class={cx('--accordion__content')}>
    <slot />
  </div>
</li>
