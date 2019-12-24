<script>
  let className = undefined;
  export { className as class };
  export let value = '';
  export let type = 'text';
  export let small = false;
  export let placeHolderText = '';
  export let labelText = '';
  export let closeButtonLabelText = 'Clear search input';
  export let size = small ? 'sm' : 'xl';
  export let light = false;
  export let id = Math.random();
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import Search16 from 'carbon-icons-svelte/lib/Search16';
  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let inputRef = undefined;
</script>

<div
  class={cx('--search', size && `--search--${size}`, light && '--search--light', className)}
  {style}>
  <Search16 class={cx('--search-magnifier')} />
  <label for={id} class={cx('--label')}>{labelText}</label>
  <input
    bind:this={inputRef}
    role="searchbox"
    class={cx('--search-input')}
    placeholder={placeHolderText}
    on:change
    on:input
    on:input={event => {
      value = event.target.value;
    }}
    {type}
    {id}
    {value} />
  <button
    type="button"
    class={cx('--search-close', value === '' && '--search-close--hidden')}
    on:click
    on:click={() => {
      value = '';
      dispatch('change', value);
      inputRef.focus();
    }}
    aria-label={closeButtonLabelText}>
    <svelte:component this={size === 'xl' ? Close20 : Close16} />
  </button>
</div>
