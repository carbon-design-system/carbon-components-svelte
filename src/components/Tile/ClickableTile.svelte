<script>
  let className = undefined;
  export { className as class };
  export let clicked = false;
  export let href = undefined;
  export let light = false;
  export let rel = undefined;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<a
  class={cx('--link', '--tile', '--tile--clickable', clicked && '--tile--is-clicked', light && '--tile--light', className)}
  on:click
  on:click={() => {
    clicked = !clicked;
  }}
  on:keydown
  on:keydown={({ key }) => {
    if (key === ' ' || key === 'Enter') {
      clicked = !clicked;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  {style}
  {href}
  {rel}>
  <slot />
</a>
