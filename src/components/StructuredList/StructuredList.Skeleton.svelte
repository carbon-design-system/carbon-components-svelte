<script>
  let className = undefined;
  export { className as class };
  export let border = false;
  export let rowCount = 5;
  export let style = undefined;

  import { cx, fillArray } from '../../lib';

  const _class = cx(
    '--skeleton',
    '--structured-list',
    border && '--structured-list--border',
    className
  );
  const rows = fillArray(rowCount - 1);
</script>

<section on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
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
    {#each rows as row, i (row)}
      <div class={cx('--structured-list-row')}>
        <div class={cx('--structured-list-td')} />
        <div class={cx('--structured-list-td')} />
        <div class={cx('--structured-list-td')} />
      </div>
    {/each}
  </div>
</section>
