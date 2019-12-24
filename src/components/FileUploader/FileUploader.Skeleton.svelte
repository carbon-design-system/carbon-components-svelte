<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import SkeletonText from '../SkeletonText';
  import { ButtonSkeleton } from '../Button';
  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <SkeletonText heading width="100px" />
  <SkeletonText width="225px" class={cx('--label-description')} />
  <ButtonSkeleton />
</div>
