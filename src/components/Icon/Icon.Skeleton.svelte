<script>
  let className = undefined;
  export { className as class };
  export let size = 16;
  export let style = undefined;

  import { cx, css } from '../../lib';

  const _class = cx('--icon--skeleton', className);
  const _style = css([style, ['width', `${size}px`], ['height', `${size}px`]]);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} style={_style} />
