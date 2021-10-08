<script>
  import { ButtonSkeleton } from "../Button";
  import { SkeletonText } from "../SkeletonText";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
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
