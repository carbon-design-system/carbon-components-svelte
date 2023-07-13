<script>
  import ButtonSkeleton from "../Button/ButtonSkeleton.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <SkeletonText heading width="100px" />
  <SkeletonText width="225px" class="bx--label-description" />
  <ButtonSkeleton />
</div>
