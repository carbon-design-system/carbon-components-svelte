<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import SkeletonText from '../SkeletonText';
  import { ButtonSkeleton } from '../Button';
  import { cx } from '../../lib';

  const _class = cx('--form-item', className);
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <SkeletonText heading width="100px" />
  <SkeletonText width="225px" class={cx('--label-description')} />
  <ButtonSkeleton />
</div>
