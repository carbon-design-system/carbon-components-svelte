<script>
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--pagination="{true}"
  class:cds--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:cds--pagination__left="{true}">
    <SkeletonText width="70px" />
    <SkeletonText width="35px" />
    <SkeletonText width="105px" />
  </div>
  <div
    class:cds--pagination__right="{true}"
    class:cds--pagination--inline="{true}"
  >
    <SkeletonText width="70px" />
  </div>
</div>
