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
  const _class = cx('--select-option', className);
</script>

<option class={_class} {value} {disabled} {hidden} {style} selected={$selected === value}>
  {text}
</option>
