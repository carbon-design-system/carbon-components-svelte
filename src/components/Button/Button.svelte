<script>
  let className = undefined;
  export { className as class };
  export let as = undefined;
  export let disabled = false;
  export let size = 'default';
  export let small = false;
  export let kind = 'primary';
  export let href = undefined;
  export let tabindex = '0';
  export let type = 'button';
  export let renderIcon = undefined;
  export let iconDescription = undefined;
  export let hasIconOnly = false;
  export let tooltipPosition = undefined;
  export let tooltipAlignment = undefined;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--btn',
    size === 'field' && '--btn--field',
    (size === 'small' || small) && '--btn--sm',
    kind === 'primary' && '--btn--primary',
    kind === 'danger' && '--btn--danger',
    kind === 'secondary' && '--btn--secondary',
    kind === 'ghost' && '--btn--ghost',
    kind === 'danger--primary' && '--btn--danger--primary',
    kind === 'tertiary' && '--btn--tertiary',
    disabled && '--btn--disabled',
    hasIconOnly && '--btn--icon-only',
    hasIconOnly && '--tooltip__trigger',
    hasIconOnly && '--tooltip--a11y',
    hasIconOnly && tooltipPosition && `--tooltip--${tooltipPosition}`,
    hasIconOnly && tooltipAlignment && `--tooltip--align-${tooltipAlignment}`,
    className
  );
  const buttonProps = {
    role: 'button',
    type: href && !disabled ? undefined : type,
    tabindex,
    class: _class,
    disabled,
    href,
    style
  };
</script>

{#if as}
  <slot props={buttonProps} />
{:else}
  {#if href && !disabled}
    <a {...buttonProps} {href} on:click on:mouseover on:mouseenter on:mouseleave>
      {#if hasIconOnly}
        <span class={cx('--assistive-text')}>{iconDescription}</span>
      {/if}
      <slot />
      {#if renderIcon}
        <svelte:component
          this={renderIcon}
          aria-hidden="true"
          class={cx('--btn__icon')}
          aria-label={iconDescription} />
      {/if}
    </a>
  {:else}
    <button {...buttonProps} on:click on:mouseover on:mouseenter on:mouseleave>
      {#if hasIconOnly}
        <span class={cx('--assistive-text')}>{iconDescription}</span>
      {/if}
      <slot />
      {#if renderIcon}
        <svelte:component
          this={renderIcon}
          aria-hidden="true"
          class={cx('--btn__icon')}
          aria-label={iconDescription} />
      {/if}
    </button>
  {/if}
{/if}
