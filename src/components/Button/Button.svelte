<script>
  let className = undefined;
  export { className as class };
  export let as = undefined;
  export let disabled = false;
  export let href = undefined;
  export let icon = undefined;
  export let iconDescription = undefined;
  export let kind = 'primary';
  export let size = 'default';
  export let style = undefined;
  export let tabindex = '0';
  export let tooltipAlignment = undefined;
  export let tooltipPosition = undefined;
  export let type = 'button';

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const ctx = getContext('ComposedModal');

  let buttonRef = undefined;

  $: if (ctx && buttonRef) {
    ctx.declareRef(buttonRef);
  }
  $: hasIconOnly = !!icon && !$$props.$$slots;
  $: buttonProps = {
    role: 'button',
    type: href && !disabled ? undefined : type,
    tabindex,
    disabled,
    href,
    style,
    class: cx(
      '--btn',
      size === 'field' && '--btn--field',
      size === 'small' && '--btn--sm',
      kind && `--btn--${kind}`,
      disabled && '--btn--disabled',
      hasIconOnly && '--btn--icon-only',
      hasIconOnly && '--tooltip__trigger',
      hasIconOnly && '--tooltip--a11y',
      hasIconOnly && tooltipPosition && `--tooltip--${tooltipPosition}`,
      hasIconOnly && tooltipAlignment && `--tooltip--align-${tooltipAlignment}`,
      className
    )
  };
</script>

{#if as}
  <slot props={buttonProps} />
{:else if href && !disabled}
  <!-- svelte-ignore a11y-missing-attribute -->
  <a {...buttonProps} on:click on:mouseover on:mouseenter on:mouseleave>
    {#if hasIconOnly}
      <span class={cx('--assistive-text')}>{iconDescription}</span>
    {/if}
    <slot />
    {#if icon}
      <svelte:component
        this={icon}
        aria-hidden="true"
        class={cx('--btn__icon')}
        aria-label={iconDescription} />
    {/if}
  </a>
{:else}
  <button {...buttonProps} bind:this={buttonRef} on:click on:mouseover on:mouseenter on:mouseleave>
    {#if hasIconOnly}
      <span class={cx('--assistive-text')}>{iconDescription}</span>
    {/if}
    <slot />
    {#if icon}
      <svelte:component
        this={icon}
        aria-hidden="true"
        class={cx('--btn__icon')}
        aria-label={iconDescription} />
    {/if}
  </button>
{/if}
