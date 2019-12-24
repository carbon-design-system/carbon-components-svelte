<script>
  let className = undefined;
  export { className as class };
  export let disableLabelChanges = false;
  export let id = Math.random();
  export let labelText = 'Add file';
  export let multiple = false;
  export let name = '';
  export let role = 'button';
  export let tabindex = '0';
  export let kind = 'primary';
  export let accept = [];
  export let disabled = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--btn',
    '--btn--sm',
    kind && `--btn--${kind}`,
    disabled && '--btn--disabled',
    className
  );

  let inputRef = undefined;
</script>

<label
  tabindex={disabled ? '-1' : tabindex}
  aria-disabled={disabled}
  class={_class}
  for={id}
  on:keydown
  on:keydown={({ key }) => {
    if (key === ' ' || key === 'Enter') {
      inputRef.click();
    }
  }}
  {style}>
  <span {role}>{labelText}</span>
</label>
<input
  bind:this={inputRef}
  type="file"
  tabindex="-1"
  class={cx('--visually-hidden')}
  on:change|stopPropagation
  on:change|stopPropagation={({ target }) => {
    const files = target.files;
    const length = files.length;
    if (files && !disableLabelChanges) {
      labelText = length > 1 ? `${length} files` : files[0].name;
    }
  }}
  on:click
  on:click={event => {
    event.target.value = null;
  }}
  {id}
  {disabled}
  {multiple}
  {accept}
  {name} />
