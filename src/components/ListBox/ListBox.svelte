<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let id = Math.random();
  export let invalid = false;
  export let invalidText = '';
  export let light = false;
  export let open = false;
  export let size = undefined;
  export let style = undefined;
  export let type = 'default';

  import { cx } from '../../lib';
</script>

<div
  role="listbox"
  tabindex="-1"
  data-invalid={invalid || undefined}
  aria-label={$$props['aria-label']}
  class={cx('--list-box', size && `--list-box--${size}`, type === 'inline' && '--list-box--inline', disabled && '--list-box--disabled', open && '--list-box--expanded', light && '--list-box--light', className)}
  on:keydown
  on:keydown={event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  }}
  on:click|preventDefault|stopPropagation
  {style}
  {id}>
  <slot />
</div>
{#if invalid}
  <div class={cx('--form-requirement')}>{invalidText}</div>
{/if}
