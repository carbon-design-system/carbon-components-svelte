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
  export let props = {};

  import { cx } from '../../lib';

  const _class = cx(
    '--radio-button-wrapper',
    labelPosition !== 'right' && `--radio-button-wrapper--label-${labelPosition}`,
    className
  );
  const _innerLabelClass = cx(hideLabel && '--visually-hidden');
</script>

<div class={_class}>
  <input
    {...props}
    type="radio"
    class={cx('--radio-button')}
    on:change
    on:change={event => {
      value = event.target.value;
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
