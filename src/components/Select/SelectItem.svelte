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

  const ctx = getContext('Select') || getContext('TimePickerSelect');
</script>

<option
  selected={ctx.$selected === value}
  class={cx('--select-option', className)}
  {value}
  {disabled}
  {hidden}
  {style}>
  {text}
</option>
