<script>
  let className = undefined;
  export { className as class };
  export const clearFiles = () => (files = []);
  export let accept = [];
  export let buttonLabel = '';
  export let files = [];
  export let iconDescription = 'Provide icon description';
  export let kind = 'primary';
  export let labelDescription = '';
  export let labelTitle = '';
  export let multiple = false;
  export let name = '';
  export let status = 'uploading';
  export let style = undefined;

  import { createEventDispatcher, afterUpdate } from 'svelte';
  import { cx } from '../../lib';
  import Filename from './Filename.svelte';
  import FileUploaderButton from './FileUploaderButton.svelte';

  const dispatch = createEventDispatcher();

  let prevFiles = [];

  afterUpdate(() => {
    if (files.length > prevFiles.length) {
      dispatch('add', files);
    } else {
      dispatch(
        'remove',
        prevFiles.filter(_ => !files.includes(_))
      );
    }

    prevFiles = [...files];
  });
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <strong class={cx('--file--label')}>{labelTitle}</strong>
  <p class={cx('--label-description')}>{labelDescription}</p>
  <FileUploaderButton
    disableLabelChanges
    labelText={buttonLabel}
    on:change
    on:change={({ target }) => {
      files = [...target.files].map(({ name }) => name);
    }}
    {accept}
    {name}
    {multiple}
    {kind} />
  <div class={cx('--file-container')}>
    {#each files as name, i (name)}
      <span class={cx('--file__selected-file')}>
        <p class={cx('--file-filename')}>{name}</p>
        <span class={cx('--file__state-container')}>
          <Filename
            on:keydown
            on:keydown={({ key }) => {
              if (key === ' ' || key === 'Enter') {
                files = files.filter((_, index) => index !== i);
              }
            }}
            on:click
            on:click={() => {
              files = files.filter((_, index) => index !== i);
            }}
            {iconDescription}
            {status} />
        </span>
      </span>
    {/each}
  </div>
</div>
