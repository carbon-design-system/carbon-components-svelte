<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let id = Math.random();
  export let name = '';
  export let style = undefined;
  export let title = 'title';
  export let value = 'value';

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const { selectedValue, update } = getContext('StructuredListWrapper');

  if (checked) {
    update(value);
  }

  $: checked = $selectedValue === value;
</script>

<input
  type="radio"
  tabindex="-1"
  class={cx('--structured-list-input', className)}
  on:change={() => {
    update(value);
  }}
  {checked}
  {id}
  {name}
  {style}
  {title}
  {value} />
