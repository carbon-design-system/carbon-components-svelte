<script>
  /** @extends {"../SkeletonPlaceholder/SkeletonPlaceholder.svelte"} SkeletonPlaceholderProps */

  import SkeletonPlaceholder from "../SkeletonPlaceholder/SkeletonPlaceholder.svelte";

  /**
   * Specify the icon size.
   * Carbon icons use a 16/20/24/32 scale, but any number (pixels) can be used.
   * @type {(16 | 20 | 24 | 32 | (number & {}))}
   */
  export let size = 16;

  /**
   * Set to `true` to use the AI variant, a blue shimmer for content that
   * AI is generating
   */
  export let ai = false;

  // The icon variant has its own class (a tighter corner radius), so `ai`
  // is not forwarded to SkeletonPlaceholder.
  $: props = ai
    ? {
        ...$$restProps,
        class: [$$restProps.class, "bx--skeleton__icon--ai"]
          .filter(Boolean)
          .join(" "),
      }
    : $$restProps;
</script>

<SkeletonPlaceholder
  {size}
  {...props}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
/>
