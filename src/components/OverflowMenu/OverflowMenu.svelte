<script>
  let className = undefined;
  export { className as class };
  export let open = false;
  export let direction = 'bottom';
  export let flipped = false;
  export let tabindex = '0';
  export let id = Math.random();
  export let iconDescription = 'Open and close list of options';
  export let iconClass = undefined;
  export let icon = OverflowMenuVertical16;
  export let light = false;
  export let menuOptionsClass = undefined;
  export let style = undefined;

  import { createEventDispatcher, setContext, afterUpdate } from 'svelte';
  import { writable } from 'svelte/store';
  import OverflowMenuVertical16 from 'carbon-icons-svelte/lib/OverflowMenuVertical16';
  import { cx } from '../../lib';
  import { formatStyle } from './formatStyle';

  const dispatch = createEventDispatcher();

  let items = writable([]);
  let currentId = writable(undefined);
  let focusedId = writable(undefined);
  let currentIndex = writable(-1);

  let buttonRef = undefined;
  let buttonWidth = undefined;
  let menuRef = undefined;

  setContext('OverflowMenu', {
    focusedId,
    add: ({ id, text, primaryFocus }) => {
      items.update(_ => {
        if (primaryFocus) {
          currentIndex.set(_.length);
        }

        return [..._, { id, text, primaryFocus, index: _.length }];
      });
    },
    update: id => {
      currentId.set(id);
    },
    change: direction => {
      // TODO: skip disabled
      let index = $currentIndex + direction;

      if (index < 0) {
        index = $items.length - 1;
      } else if (index >= $items.length) {
        index = 0;
      }

      currentIndex.set(index);
    }
  });

  afterUpdate(() => {
    if ($currentId) {
      const { index, text } = $items.filter(_ => _.id === $currentId)[0];
      dispatch('close', { index, text });
      open = false;
    }

    if (open) {
      const { width, height } = buttonRef.getBoundingClientRect();

      buttonWidth = width;

      if ($currentIndex < 0) {
        menuRef.focus();
      }

      if (flipped) {
        menuRef.style.left = 'auto';
        menuRef.style.right = 0;
      }

      if (direction === 'top') {
        menuRef.style.top = 'auto';
        menuRef.style.bottom = height + 'px';
      }
    }

    if (!open) {
      buttonRef.focus();
      items.set([]);
      currentId.set(undefined);
    }
  });

  $: ariaLabel = $$props['aria-label'] || 'menu';
  $: if ($items[$currentIndex]) {
    focusedId.set($items[$currentIndex].id);
  }
  $: dynamicPseudoWidth = `.bx--overflow-menu-options.bx--overflow-menu-options:after {
      width: ${buttonWidth ? buttonWidth + 'px' : '2rem'};
    }`;
  $: styles = formatStyle(dynamicPseudoWidth);
</script>

<svelte:head>
  {@html styles}
</svelte:head>

<!-- TODO: extract utility component -->
<svelte:body
  on:click={({ target }) => {
    if (buttonRef && buttonRef.contains(target)) {
      return;
    }
    if (menuRef && !menuRef.contains(target)) {
      open = false;
    }
  }} />

<button
  bind:this={buttonRef}
  aria-haspopup
  aria-expanded={open}
  aria-label={ariaLabel}
  class={cx('--overflow-menu', open && '--overflow-menu--open', light && '--overflow-menu--light', className)}
  on:click
  on:click={({ target }) => {
    if (!(menuRef && menuRef.contains(target))) {
      open = !open;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={event => {
    if (open) {
      if (['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
      } else if (event.key === 'Escape') {
        event.stopPropagation();
        open = false;
      }
    }
  }}
  {id}
  {tabindex}
  {style}>
  <slot name="menu">
    <svelte:component
      this={icon}
      class={cx('--overflow-menu__icon', iconClass)}
      aria-label={iconDescription}
      title={iconDescription} />
  </slot>
  {#if open}
    <ul
      bind:this={menuRef}
      role="menu"
      tabindex="-1"
      aria-label={ariaLabel}
      data-floating-menu-direction={direction}
      class={cx('--overflow-menu-options', flipped && '--overflow-menu--flip', open && '--overflow-menu-options--open', light && '--overflow-menu-options--light', menuOptionsClass)}>
      <slot />
    </ul>
  {/if}
</button>
