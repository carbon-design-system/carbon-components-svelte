<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
  import SkeletonText from '../SkeletonText';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--pagination', '--skeleton', className)}
  {style}>
  <div class={cx('--pagination__left')}>
    <SkeletonText width="70px" />
    <SkeletonText width="35px" />
    <SkeletonText width="105px" />
  </div>
  <div class={cx('--pagination__right', '--pagination--inline')}>
    <SkeletonText width="70px" />
  </div>
</div>
