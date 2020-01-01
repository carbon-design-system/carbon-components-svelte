<script>
  let className = undefined;
  export { className as class };
  export let backwardText = 'Previous page';
  export let disabled = false;
  export let forwardText = 'Next page';
  export let id = Math.random();
  export let itemRangeText = (min, max, total) => `${min}–${max} of ${total} items`;
  export let itemsPerPageText = 'Items per page:';
  export let itemText = (min, max) => `${min}–${max} items`;
  export let page = 1;
  export let pageInputDisabled = false;
  export let pageRangeText = (current, total) => `of ${total} pages`;
  export let pageSize = 10;
  export let pageSizes = [10];
  export let pagesUnknown = false;
  export let pageText = page => `page ${page}`;
  export let style = undefined;
  export let totalItems = 0;

  import CaretLeft24 from 'carbon-icons-svelte/lib/CaretLeft24';
  import CaretRight24 from 'carbon-icons-svelte/lib/CaretRight24';
  import { cx, fillArray } from '../../lib';
  import Select, { SelectItem } from '../Select';

  $: totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  $: selectItems = fillArray(totalPages);
  $: backButtonDisabled = disabled || page === 1;
  $: forwardButtonDisabled = disabled || page === totalPages;
</script>

<div class={cx('--pagination', className)} {style}>
  <div class={cx('--pagination__left')}>
    <label
      id={cx(`--pagination-select-${id}-count-label`)}
      class={cx('--pagination__text')}
      for={cx(`--pagination-select-${id}`)}>
      {itemsPerPageText}
    </label>
    <Select
      id={cx(`--pagination-select-${id}`)}
      class={cx('--select__item-count')}
      labelText=""
      hideLabel
      noLabel
      inline
      on:change={() => {
        page = 1;
      }}
      bind:defaultValue={pageSize}>
      {#each pageSizes as size, i (size)}
        <SelectItem value={size} text={size.toString()} />
      {/each}
    </Select>
    <span class={cx('--pagination__text')}>
      {#if pagesUnknown}
        {itemText(pageSize * (page - 1) + 1, page * pageSize)}
      {:else}
        {itemRangeText(Math.min(pageSize * (page - 1) + 1, totalItems), Math.min(page * pageSize, totalItems), totalItems)}
      {/if}
    </span>
  </div>
  <div class={cx('--pagination__right')}>
    {#if !pageInputDisabled}
      <Select
        id={cx(`--pagination-select-${id + 2}`)}
        class={cx('--select__page-number')}
        labelText={`Page number, of ${totalPages} pages`}
        inline
        hideLabel
        on:change={({ detail }) => {
          page = Number(detail);
        }}
        bind:defaultValue={page}>
        {#each selectItems as size, i (size)}
          <SelectItem value={size + 1} text={(size + 1).toString()} />
        {/each}
      </Select>
      <span class={cx('--pagination__text')}>
        {#if pagesUnknown}{pageText(page)}{:else}{pageRangeText(page, totalPages)}{/if}
      </span>
    {/if}
    <button
      type="button"
      class={cx('--pagination__button', '--pagination__button--backward', backButtonDisabled && '--pagination__button--no-index')}
      on:click={() => {
        page--;
      }}
      aria-label={backwardText}
      disabled={backButtonDisabled}>
      <CaretLeft24 />
    </button>
    <button
      type="button"
      class={cx('--pagination__button', '--pagination__button--forward', forwardButtonDisabled && '--pagination__button--no-index')}
      aria-label={forwardText}
      on:click={() => {
        page++;
      }}
      disabled={forwardButtonDisabled}>
      <CaretRight24 />
    </button>
  </div>
</div>
