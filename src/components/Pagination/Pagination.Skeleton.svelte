<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import SkeletonText from '../SkeletonText';
  import { cx } from '../../lib';

  const _class = cx('--pagination', '--skeleton', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <div class={cx('--pagination__left')}>
    <SkeletonText width="70px" />
    <SkeletonText width="35px" />
    <SkeletonText width="105px" />
  </div>
  <div class={cx('--pagination__right', '--pagination--inline')}>
    <SkeletonText width="70px" />
  </div>
</div>
