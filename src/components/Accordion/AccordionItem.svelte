<script>
  // NOTE: no 'renderExpando'; use 'expando' named slot
  // TODO: change 'expando' to something more intuitive?
  let className = undefined;
  export { className as class };
  export let title = undefined;
  export let iconDescription = 'Expand/Collapse';
  export let open = false;
  export let style = undefined;

  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { cx } from '../../lib';

  let animation = undefined;

  $: animation = open ? 'expanding' : 'collapsing';
  $: _class = cx(
    '--accordion__item',
    open && '--accordion__item--active',
    animation && `--accordion__item--${animation}`,
    className
  );
</script>

<li
  {style}
  class={_class}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}>
  <button
    type="button"
    class={cx('--accordion__heading')}
    title={iconDescription}
    aria-expanded={open}
    on:click
    on:click={() => {
      open = !open;
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={event => {
      if (open && event.key === 'Escape') {
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
