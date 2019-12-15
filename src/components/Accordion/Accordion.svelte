<script>
  let className = undefined;
  export { className as class };
  export let props = {};

  import { cx } from '../../lib';
</script>

<ul {...props} class={cx('--accordion', className)}>
  <slot />
</ul>
