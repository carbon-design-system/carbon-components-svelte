<script>
  let className = undefined;
  export { className as class };
  export let danger = false;
  export let disabled = false;
  export let hasDivider = false;
  export let href = '';
  export let primaryFocus = false;
  export let requireTitle = true;
  export let style = undefined;
  export let text = 'Provide text';

  import { getContext, afterUpdate } from 'svelte';
  import { cx } from '../../lib';

  const id = Math.random();
  const { focusedId, add, update, change } = getContext('OverflowMenu');

  let buttonRef = undefined;

  add({ id, text, primaryFocus });

  afterUpdate(() => {
    if (primaryFocus) {
      buttonRef.focus();
    }
  });

  $: primaryFocus = $focusedId === id;
  $: buttonProps = {
    tabindex: '-1',
    title: requireTitle ? text : undefined,
    class: cx('--overflow-menu-options__btn'),
    disabled: href ? undefined : disabled,
    href: href ? href : undefined
  };
</script>

<li
  role="menuitem"
  class={cx('--overflow-menu-options__option', hasDivider && '--overflow-menu--divider', danger && '--overflow-menu-options__option--danger', disabled && '--overflow-menu-options__option--disabled', className)}
  {style}>
  {#if href}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      bind:this={buttonRef}
      {...buttonProps}
      on:click
      on:click={() => {
        update(id);
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}>
      <slot>
        <div class={cx('--overflow-menu-options__option-content')}>{text}</div>
      </slot>
    </a>
  {:else}
    <button
      bind:this={buttonRef}
      {...buttonProps}
      on:click
      on:click={() => {
        update(id);
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}>
      <slot>
        <div class={cx('--overflow-menu-options__option-content')}>{text}</div>
      </slot>
    </button>
  {/if}
</li>
