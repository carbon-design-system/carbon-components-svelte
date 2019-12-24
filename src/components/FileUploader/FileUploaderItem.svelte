<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let status = 'uploading';
  export let iconDescription = '';
  export let name = '';
  export let invalid = false;
  export let errorSubject = '';
  export let errorBody = '';
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';
  import Filename from './Filename.svelte';

  const dispatch = createEventDispatcher();
  const _class = cx(
    '--file__selected-file',
    invalid && '--file__selected-file--invalid',
    className
  );
</script>

<span on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <p class={cx('--file-filename')}>{name}</p>
  <span class={cx('--file__state-container')}>
    <Filename
      {iconDescription}
      {status}
      {invalid}
      on:keydown={({ key }) => {
        if (key === ' ' || key === 'Enter') {
          dispatch('delete', id);
        }
      }}
      on:click={() => {
        dispatch('delete', id);
      }} />
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
