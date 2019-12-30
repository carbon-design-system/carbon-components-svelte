<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let selectionCount = undefined;
  export const translationIds = { clearAll: 'clearAll', clearSelection: 'clearSelection' };
  export let translateWithId = id => defaultTranslations[id];
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  const defaultTranslations = {
    [translationIds.clearAll]: 'Clear all selected items',
    [translationIds.clearSelection]: 'Clear selected item'
  };

  $: description = selectionCount ? translateWithId('clearAll') : translateWithId('clearSelection');
</script>

<div
  role="button"
  aria-label="Clear Selection"
  tabindex={disabled ? '-1' : '0'}
  title={description}
  class={cx('--list-box__selection', selectionCount && '--tag--filter', selectionCount && '--list-box__selection--multi', className)}
  on:click
  on:click|stopPropagation={event => {
    if (!disabled) {
      dispatch('clear', event);
    }
  }}
  on:keydown
  on:keydown|stopPropagation={event => {
    if (!disabled && event.key === 'Enter') {
      dispatch('clear', event);
    }
  }}
  {style}>
  {selectionCount}
  <Close16 />
</div>
