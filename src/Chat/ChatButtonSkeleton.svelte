<script>
  /**
   * @extends {"../Button/ButtonSkeleton.svelte"} ButtonSkeletonProps
   */

  /**
   * Specify the size of the skeleton, to match the ChatButton it stands in for.
   * Falls back to the height of a parent `Form`'s size, as ButtonSkeleton does.
   * @type {"default" | "field" | "small"}
   * @default "default"
   */
  export let size = undefined;

  import ButtonSkeleton from "../Button/ButtonSkeleton.svelte";
</script>

<ButtonSkeleton
  {size}
  {...$$restProps}
  class={["bx--chat-btn", $$restProps.class].filter(Boolean).join(" ")}
  on:click
  on:focus
  on:blur
  on:mouseover
  on:mouseenter
  on:mouseleave
/>
