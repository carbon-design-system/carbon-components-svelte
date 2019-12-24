<script>
  let className = undefined;
  export { className as class };
  export let name = '';
  export let role = 'button';
  export let id = Math.random();
  export let disabled = false;
  export let tabindex = '0';
  export let labelText = 'Add file';
  export let multiple = false;
  export let accept = [];
  export let validateFiles = files => files;
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import SkeletonText from '../SkeletonText';
  import { ButtonSkeleton } from '../Button';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _labelClass = cx('--file-browse-btn', disabled && '--file-browse-btn--disabled');

  let over = false;
  let inputRef = undefined;

  $: _class = cx('--file__drop-container', over && '--file__drop-container--drag-over', className);
</script>

<div
  class={cx('--file')}
  on:dragover
  on:dragover|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = true;
      dataTransfer.dropEffect = 'copy';
    }
  }}
  on:dragleave
  on:dragleave|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dataTransfer.dropEffect = 'move';
    }
  }}
  on:drop
  on:drop|preventDefault|stopPropagation={({ dataTransfer }) => {
    if (!disabled) {
      over = false;
      dispatch('add', validateFiles(dataTransfer.files));
    }
  }}
  {style}>
  <label
    class={_labelClass}
    for={id}
    on:keydown
    on:keydown={({ key }) => {
      if (key === ' ' || key === 'Enter') {
        inputRef.click();
      }
    }}
    {tabindex}>
    <div class={_class} {role}>
      {labelText}
      <input
        bind:this={inputRef}
        type="file"
        tabindex="-1"
        class={cx('--file-input')}
        on:change
        on:change={({ target }) => {
          dispatch('add', validateFiles(target.files));
        }}
        on:click
        on:click={({ target }) => {
          target.value = null;
        }}
        {id}
        {disabled}
        {accept}
        {name}
        {multiple} />
    </div>
  </label>
</div>
