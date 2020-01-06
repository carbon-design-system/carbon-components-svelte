<script>
  let className = undefined;
  export { className as class };
  export let isSortHeader = false;
  export let isSortable = false;
  export let scope = 'col';
  export let sortDirection = undefined;
  export let translateWithId = () => '';
  export let style = undefined;

  import ArrowUp20 from 'carbon-icons-svelte/lib/ArrowUp20';
  import ArrowsVertical20 from 'carbon-icons-svelte/lib/ArrowsVertical20';
  import { cx } from '../../lib';

  const sortDirections = {
    NONE: 'none',
    ASC: 'ascending',
    DESC: 'descending'
  };

  $: ariaSort = isSortHeader ? sortDirections[sortDirection] : 'none';
  // TODO: translate with id
  $: ariaLabel = translateWithId();
</script>

{#if !isSortable}
  <th on:click on:mouseover on:mouseenter on:mouseleave class={className} {style} {scope}>
    <span class={cx('--table-header-label')}>
      <slot />
    </span>
  </th>
{:else}
  <th
    {scope}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--table-sort', isSortHeader && sortDirection !== 'NONE' && '--table-sort--active', isSortHeader && sortDirection === 'DESC' && '--table-sort--ascending', className)}
    aria-sort={ariaSort}>
    <button on:click>
      <span class={cx('--table-header-label')}>
        <slot />
      </span>
      <ArrowUp20 class={cx('--table-sort__icon')} aria-label={ariaLabel} />
      <ArrowsVertical20 class={cx('--table-sort__icon-unsorted')} aria-label={ariaLabel} />
    </button>
  </th>
{/if}
