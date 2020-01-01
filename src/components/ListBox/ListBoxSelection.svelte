<script>
  let className = undefined;
  export { className as class };
  export const translationIds = { clearAll: 'clearAll', clearSelection: 'clearSelection' };
  export let disabled = false;
  export let selectionCount = undefined;
  export let style = undefined;
  export let translateWithId = id => defaultTranslations[id];

  import { createEventDispatcher, getContext } from 'svelte';
  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import { cx } from '../../lib';

  const defaultTranslations = {
    [translationIds.clearAll]: 'Clear all selected items',
    [translationIds.clearSelection]: 'Clear selected item'
  };
  const dispatch = createEventDispatcher();
  const ctx = getContext('MultiSelect');

  let selectionRef = undefined;

  $: if (ctx && selectionRef) {
    ctx.declareRef({ key: 'selection', ref: selectionRef });
  }

  $: description = selectionCount ? translateWithId('clearAll') : translateWithId('clearSelection');
</script>

<div
  bind:this={selectionRef}
  role="button"
  aria-label="Clear Selection"
  tabindex={disabled ? '-1' : '0'}
  title={description}
  class={cx('--list-box__selection', selectionCount && '--tag--filter', selectionCount && '--list-box__selection--multi', className)}
  on:click|preventDefault|stopPropagation={event => {
    if (!disabled) {
      dispatch('clear', event);
    }
  }}
  on:keydown|stopPropagation={event => {
    if (!disabled && event.key === 'Enter') {
      dispatch('clear', event);
    }
  }}
  {style}>
  {#if selectionCount}{selectionCount}{/if}
  <Close16 />
</div>
