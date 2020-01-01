<script>
  let className = undefined;
  export { className as class };
  export let accept = [];
  export let disabled = false;
  export let disableLabelChanges = false;
  export let id = Math.random();
  export let kind = 'primary';
  export let labelText = 'Add file';
  export let multiple = false;
  export let name = '';
  export let role = 'button';
  export let style = undefined;
  export let tabindex = '0';

  import { cx } from '../../lib';

  let inputRef = undefined;
</script>

<label
  tabindex={disabled ? '-1' : tabindex}
  aria-disabled={disabled}
  class={cx('--btn', '--btn--sm', kind && `--btn--${kind}`, disabled && '--btn--disabled', className)}
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
  on:click={({ target }) => {
    target.value = null;
  }}
  {id}
  {disabled}
  {multiple}
  {accept}
  {name} />
