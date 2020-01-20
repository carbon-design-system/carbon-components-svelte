<script>
  let className = undefined;
  export { className as class };
  export let errorBody = '';
  export let errorSubject = '';
  export let iconDescription = '';
  export let id = Math.random();
  export let invalid = false;
  export let name = '';
  export let status = 'uploading';
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';
  import Filename from './Filename.svelte';

  const dispatch = createEventDispatcher();
</script>

<span
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--file__selected-file', invalid && '--file__selected-file--invalid', className)}
  {style}>
  <p class={cx('--file-filename')}>{name}</p>
  <span class={cx('--file__state-container')}>
    <Filename
      on:keydown={({ key }) => {
        if (key === ' ' || key === 'Enter') {
          dispatch('delete', id);
        }
      }}
      on:click={() => {
        dispatch('delete', id);
      }}
      {iconDescription}
      {status}
      {invalid} />
  </span>
  {#if invalid && errorSubject}
    <div class={cx('--form-requirement')}>
      <div class={cx('--form-requirement__title')}>{errorSubject}</div>
      {#if errorBody}
        <p class={cx('--form-requirement__supplement')}>{errorBody}</p>
      {/if}
    </div>
  {/if}
</span>
