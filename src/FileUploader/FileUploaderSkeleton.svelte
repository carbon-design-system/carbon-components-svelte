<script>
  import ButtonSkeleton from "../Button/ButtonSkeleton.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";

  /** Set to `true` to hide the label title skeleton line */
  export let hideLabelTitle = false;

  /** Set to `true` to hide the label description skeleton line */
  export let hideLabelDescription = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabelTitle}
    <SkeletonText heading width="100px" />
  {/if}
  {#if !hideLabelDescription}
    <SkeletonText width="225px" class="bx--label-description" />
  {/if}
  <ButtonSkeleton />
</div>
