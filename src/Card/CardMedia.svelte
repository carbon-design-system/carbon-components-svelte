<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the aspect ratio. Has no effect in horizontal layout, where the
   * media column stretches to the full card height instead.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2"}
   */
  export let ratio = undefined;

  /**
   * Width of the media column in horizontal layout. Accepts any CSS width
   * value. Has no effect outside horizontal layout.
   */
  export let mediaWidth = "33.33%";

  import { getContext } from "svelte";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";

  const horizontal = getContext("carbon:Card")?.horizontal;

  $: mediaClass = ["bx--card__media", $$restProps.class]
    .filter(Boolean)
    .join(" ");
</script>

{#if $horizontal}
  <div
    {...$$restProps}
    class={mediaClass}
    class:bx--card__media--horizontal={true}
    style:--bx--card--media-width={mediaWidth}
  >
    <slot />
  </div>
{:else}
  <AspectRatio {ratio} {...$$restProps} class={mediaClass}>
    <slot />
  </AspectRatio>
{/if}
