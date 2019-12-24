<script>
  let className = undefined;
  export { className as class };
  export let value = '';
  export let text = '';
  export let disabled = false;
  export let hidden = false;
  export let style = undefined;

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const { selected } = getContext('Select');
</script>

<option
  selected={$selected === value}
  class={cx('--select-option', className)}
  {value}
  {disabled}
  {hidden}
  {style}>
  {text}
</option>
