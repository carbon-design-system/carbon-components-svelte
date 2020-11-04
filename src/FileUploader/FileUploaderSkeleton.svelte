<script>
  import { ButtonSkeleton } from "../Button";
  import { SkeletonText } from "../SkeletonText";
</script>

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
