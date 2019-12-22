<script>
  let className = undefined;
  export { className as class };
  export let value = '';
  export let checked = false;
  export let disabled = false;
  export let id = Math.random();
  export let labelText = '';
  export let hideLabel = false;
  export let labelPosition = 'right';
  export let name = '';
  export let style = undefined;

  import { getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const ctx = getContext('RadioButtonGroup');
  const _class = cx(
    '--radio-button-wrapper',
    labelPosition !== 'right' && `--radio-button-wrapper--label-${labelPosition}`,
    className
  );
  const _innerLabelClass = cx(hideLabel && '--visually-hidden');

  let selected = ctx ? ctx.selected : writable(checked ? value : undefined);

  if (ctx) {
    ctx.add({ id, checked, disabled, value });
  }

  $: checked = $selected === value;
</script>

<div class={_class} {style}>
  <input
    type="radio"
    class={cx('--radio-button')}
    on:change
    on:change={() => {
      if (ctx) {
        ctx.update(value);
      }
    }}
    {id}
    {name}
    {checked}
    {disabled}
    {value} />
  <label for={id} class={cx('--radio-button__label')}>
    <span class={cx('--radio-button__appearance')} />
    <span class={_innerLabelClass}>{labelText}</span>
  </label>
</div>
