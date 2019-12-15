<script>
  // NOTE: no 'renderExpando'; use 'expando' named slot
  // TODO: change 'expando' to something more intuitive?
  let className = undefined;
  export { className as class };
  export let title = undefined;
  export let iconDescription = 'Expand/Collapse';
  export let open = false;
  export let props = {};

  import { createEventDispatcher } from 'svelte';
  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  let animation = undefined;

  function handleAnimationEnd(event) {
    animation = undefined;
  }

  function handleClick(event) {
    animation = open ? 'collapsing' : 'expanding';
    open = !open;
    dispatch('headingclick', { open, event });
  }

  function handleKeyDown(event) {
    if (open && event.key === 'Escape') {
      open = false;
    }
  }

  $: _class = cx(
    '--accordion__item',
    open && '--accordion__item--active',
    animation && `--accordion__item--${animation}`,
    className
  );
  $: accordionItemProps = {
    type: 'button',
    class: cx('--accordion__heading'),
    title: iconDescription,
    'aria-expanded': open,
    onClick: handleClick,
    onKeyDown: handleKeyDown
  };
</script>

<li class={_class} {...props} on:animationend on:animationend={handleAnimationEnd}>
  <slot name="expando" props={accordionItemProps}>
    <button {...accordionItemProps} on:click={handleClick} on:keydown={handleKeyDown}>
      <ChevronRight16 class={cx('--accordion__arrow')} aria-label={iconDescription} />
      <div class={cx('--accordion__title')}>
        <slot name="title">{title}</slot>
      </div>
    </button>
  </slot>
  <div class={cx('--accordion__content')}>
    <slot />
  </div>
</li>
