<script>
  let className = undefined;
  export { className as class };
  export let scope = 'col';
  export let translateWithId = () => '';
  export let style = undefined;

  import { getContext } from 'svelte';
  import ArrowUp20 from 'carbon-icons-svelte/lib/ArrowUp20';
  import ArrowsVertical20 from 'carbon-icons-svelte/lib/ArrowsVertical20';
  import { cx } from '../../lib';

  const id = Math.random();
  const { sortHeader, tableSortable, add } = getContext('DataTable');

  add(id);

  $: active = $sortHeader.id === id;
  // TODO: translate with id
  $: ariaLabel = translateWithId();
</script>

{#if $tableSortable}
  <th
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={className}
    aria-sort={active ? $sortHeader.sortDirection : 'none'}
    {scope}>
    <button
      class={cx('--table-sort', active && '--table-sort--active', active && $sortHeader.sortDirection === 'descending' && '--table-sort--ascending')}
      on:click>
      <span class={cx('--table-header-label')}>
        <slot />
      </span>
      <ArrowUp20 class={cx('--table-sort__icon')} aria-label={ariaLabel} />
      <ArrowsVertical20 class={cx('--table-sort__icon-unsorted')} aria-label={ariaLabel} />
    </button>
  </th>
{:else}
  <th on:click on:mouseover on:mouseenter on:mouseleave class={className} {style} {scope}>
    <span class={cx('--table-header-label')}>
      <slot />
    </span>
  </th>
{/if}
