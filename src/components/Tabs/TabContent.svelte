<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const _class = cx('--tab-content', className);
  const id = Math.random();
  const { selectedContent, addContent } = getContext('Tabs');

  addContent({ id });

  $: selected = $selectedContent === id;
</script>

<div class={_class} aria-hidden={!selected} hidden={!selected} {style}>
  <slot />
</div>
