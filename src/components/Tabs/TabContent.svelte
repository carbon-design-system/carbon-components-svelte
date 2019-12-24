<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const id = Math.random();
  const { selectedContent, addContent } = getContext('Tabs');

  addContent({ id });

  $: selected = $selectedContent === id;
</script>

<div aria-hidden={!selected} hidden={!selected} class={cx('--tab-content', className)} {style}>
  <slot />
</div>
