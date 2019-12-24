<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let label = 'Provide label';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<optgroup class={cx('--select-optgroup', className)} {label} {disabled} {style}>
  <slot />
</optgroup>
