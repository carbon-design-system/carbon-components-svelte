<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let label = 'Provide label';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--select-optgroup', className);
</script>

<optgroup class={_class} {label} {disabled} {style}>
  <slot />
</optgroup>
