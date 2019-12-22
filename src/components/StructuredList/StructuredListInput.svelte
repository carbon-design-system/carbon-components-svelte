<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let value = 'value';
  export let title = 'title';
  export let name = '';
  export let checked = false;
  export let style = undefined;

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const _class = cx('--structured-list-input', className);

  const { selected, update } = getContext('StructuredListWrapper');

  if (checked) {
    update(value);
  }

  $: checked = $selected === value;
</script>

<input
  type="radio"
  tabindex="-1"
  class={_class}
  on:change={() => {
    update(value);
  }}
  {value}
  {name}
  {title}
  {style}
  {id}
  {checked} />
