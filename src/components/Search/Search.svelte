<script>
  let className = undefined;
  export { className as class };
  export let autofocus = false;
  export let closeButtonLabelText = 'Clear search input';
  export let id = Math.random();
  export let labelText = '';
  export let light = false;
  export let placeholder = '';
  export let size = small ? 'sm' : 'xl';
  export let small = false;
  export let style = undefined;
  export let type = 'text';
  export let value = '';

  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import Search16 from 'carbon-icons-svelte/lib/Search16';
  import { cx } from '../../lib';

  let inputRef = undefined;
</script>

<div
  class={cx('--search', size && `--search--${size}`, light && '--search--light', className)}
  {style}>
  <Search16 class={cx('--search-magnifier')} />
  <label class={cx('--label')} for={id}>{labelText}</label>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    bind:this={inputRef}
    role="searchbox"
    class={cx('--search-input')}
    on:change
    on:input
    on:input={({ target }) => {
      value = target.value;
    }}
    {autofocus}
    {type}
    {id}
    {value}
    {placeholder} />
  <button
    type="button"
    aria-label={closeButtonLabelText}
    class={cx('--search-close', value === '' && '--search-close--hidden')}
    on:click
    on:click={() => {
      value = '';
      inputRef.focus();
    }}>
    <svelte:component this={size === 'xl' ? Close20 : Close16} />
  </button>
</div>
