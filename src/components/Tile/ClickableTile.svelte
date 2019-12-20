<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let rel = undefined;
  export let light = false;
  export let clicked = false;
  export let style = undefined;

  import { cx } from '../../lib';

  $: _class = cx(
    '--link',
    '--tile',
    '--tile--clickable',
    clicked && '--tile--is-clicked',
    light && '--tile--light',
    className
  );
</script>

<a
  class={_class}
  on:click
  on:click={() => {
    clicked = !clicked;
  }}
  on:keydown
  on:keydown={event => {
    if (event.key === ' ' || event.key === 'Enter') {
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
