<script>
  let className = undefined;
  export { className as class };
  export let size = 16;
  export let style = undefined;

  import { cx, css } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--icon--skeleton', className)}
  style={css([style, ['width', `${size}px`], ['height', `${size}px`]])} />
