<script>
  let className = undefined;
  export { className as class };
  export let border = false;
  export let rows = 5;
  export let style = undefined;

  import { cx, fillArray } from '../../lib';
</script>

<section
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--skeleton', '--structured-list', border && '--structured-list--border', className)}
  {style}>
  <div class={cx('--structured-list-thead')}>
    <div class={cx('--structured-list-row', '--structured-list-row--header-row')}>
      <div class={cx('--structured-list-th')}>
        <span />
      </div>
      <div class={cx('--structured-list-th')}>
        <span />
      </div>
      <div class={cx('--structured-list-th')}>
        <span />
      </div>
    </div>
  </div>
  <div class={cx('--structured-list-tbody')}>
    {#each fillArray(rows) as row, i (row)}
      <div class={cx('--structured-list-row')}>
        <div class={cx('--structured-list-td')} />
        <div class={cx('--structured-list-td')} />
        <div class={cx('--structured-list-td')} />
      </div>
    {/each}
  </div>
</section>
