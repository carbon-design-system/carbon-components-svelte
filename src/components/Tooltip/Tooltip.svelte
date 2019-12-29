<script>
  let className = undefined;
  export { className as class };
  export let triggerText = ''; // TODO: support slot?
  export let triggerId = Math.random();
  export let tooltipId = Math.random();
  export let triggerClass = undefined;
  export let open = false;
  export let direction = 'bottom';
  export let icon = Information16;
  export let showIcon = true; // TODO: change to hideIcon
  export let iconName = '';
  export let iconDescription = '';
  export let tabindex = '0';
  export let style = undefined;

  import { createEventDispatcher, afterUpdate } from 'svelte';
  import Information16 from 'carbon-icons-svelte/lib/Information16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let programmatic = true;
  let buttonRef = undefined;
  let tooltipRef = undefined;
  let iconRef = undefined;

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      open = false;
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.stopPropagation();
      event.preventDefault();
      open = true;
    }
  }

  function onBlur({ relatedTarget }) {
    if (tooltipRef && !tooltipRef.contains(relatedTarget)) {
      open = false;
    }
  }

  function openMenu() {
    programmatic = false;
    open = true;
  }

  function closeMenu() {
    programmatic = false;
    open = false;
  }

  afterUpdate(() => {
    if (open) {
      const button = buttonRef.getBoundingClientRect();
      const tooltip = tooltipRef.getBoundingClientRect();

      let iconWidth = 16;
      let iconHeight = 16;

      if (iconRef) {
        const icon = iconRef.getBoundingClientRect();
        iconWidth = icon.width;
        iconHeight = icon.height;
      }

      let offsetX = 0;
      let offsetY = 0;

      switch (direction) {
        case 'bottom':
          if (!showIcon) {
            offsetX = -1 * (tooltip.width / 2 - button.width / 2);
          } else {
            offsetX = -1 * (tooltip.width / 2 - button.width + iconWidth / 2);
          }
          offsetY = iconHeight / 2;
          break;
        case 'right':
          offsetX = button.width + 6;
          offsetY = -1 * (tooltip.height / 2 + iconWidth / 2 - 3);
          break;
        case 'left':
          if (!showIcon) {
            offsetX = -1 * (tooltip.width + 6 + 1);
          } else {
            offsetX = -1 * (tooltip.width - button.width + iconWidth + 8);
          }
          offsetY = -1 * (tooltip.height / 2 + button.height) - 2;
          break;
        case 'top':
          if (!showIcon) {
            offsetX = -1 * (tooltip.width / 2 - button.width / 2);
          } else {
            offsetX = -1 * (tooltip.width / 2 - button.width + iconWidth / 2 + 1);
          }
          offsetY = -1 * (tooltip.height + button.height + iconWidth / 2 - 1);
          break;
      }

      tooltipRef.style.left = offsetX + 'px';
      tooltipRef.style.marginTop = offsetY + 'px';
    }
  });

  $: {
    dispatch(open ? 'open' : 'close');
  }
  $: buttonProps = {
    role: 'button',
    'aria-haspopup': 'true',
    id: showIcon ? undefined : triggerId,
    class: showIcon ? cx('--tooltip__trigger') : cx('--tooltip__label', triggerClass),
    'aria-expanded': open,
    'aria-describedby': open ? tooltipId : undefined,
    'aria-labelledby': triggerText ? triggerId : undefined,
    'aria-label': triggerText ? iconDescription : undefined,
    tabindex,
    style: showIcon ? undefined : style
  };
</script>

<svelte:body
  on:click={({ target }) => {
    if (!programmatic && open && tooltipRef && !tooltipRef.contains(target)) {
      open = false;
    }
  }} />

<div style="position: relative">
  {#if showIcon}
    <div bind:this={buttonRef} id={triggerId} class={cx('--tooltip__label', triggerClass)} {style}>
      {triggerText}
      <div
        bind:this={iconRef}
        {...buttonProps}
        on:click|preventDefault|stopPropagation={openMenu}
        on:focus={openMenu}
        on:blur={onBlur}
        on:keydown={onKeydown}>
        <slot name="icon">
          <svelte:component this={icon} name={iconName} />
        </slot>
      </div>
    </div>
  {:else}
    <div
      bind:this={buttonRef}
      {...buttonProps}
      on:click|preventDefault|stopPropagation={openMenu}
      on:focus={openMenu}
      on:blur={onBlur}
      on:keydown={onKeydown}>
      <slot name="triggerText">{triggerText}</slot>
    </div>
  {/if}
  {#if open}
    <div
      bind:this={tooltipRef}
      role="tooltip"
      tabindex="0"
      id={tooltipId}
      data-floating-menu-direction={direction}
      class={cx('--tooltip', open && '--tooltip--shown', className)}
      on:blur={closeMenu}>
      <span class={cx('--tooltip__caret')} />
      <slot />
    </div>
  {/if}
</div>
