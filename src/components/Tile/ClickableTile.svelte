<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let rel = undefined;
  export let light = false;
  export let clicked = false;
  export let props = {};

  import { createEventDispatcher, tick } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  async function handleClick(event) {
    clicked = !clicked;
    await tick();
    dispatch('click', event);
  }

  async function handleKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      clicked = !clicked;
      await tick();
    }

    dispatch('keydown', event);
  }

  $: _class = cx(
    '--link',
    '--tile',
    '--tile--clickable',
    clicked && '--tile--is-clicked',
    light && '--tile--light',
    className
  );
</script>

<a {...props} class={_class} on:click={handleClick} on:keydown={handleKeyDown} {href} {rel}>
  <slot />
</a>
