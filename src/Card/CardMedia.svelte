<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the aspect ratio, as in `AspectRatio`.
   * Only applies when the card is not `horizontal`, where the media
   * fills the card's height instead.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}`}
   */
  export let ratio = "2x1";

  /**
   * Specify the width of the media, as any CSS width.
   * Only applies when the card is `horizontal`.
   */
  export let mediaWidth = "33.33%";

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import { parseAspectRatio } from "../utils/aspect-ratio.js";

  /** @type {undefined | { horizontal: import("svelte/store").Readable<boolean>; media: import("svelte/store").Writable<null | { block: number; inline: string }> }} */
  const card = getContext("carbon:Card");

  const horizontal = card?.horizontal ?? readable(false);

  // AspectRatio falls back to 2x1 for a ratio it can't read.
  $: shape = parseAspectRatio(ratio) ?? { width: 2, height: 1 };

  /** @type {null | { block: number; inline: string }} */
  let reported = null;

  // Tell the card the media's shape, so its decorator sits at the
  // header's corner. This runs as the media renders, before the decorator
  // does, so a server render places it too.
  $: if (card) {
    reported = { block: shape.height / shape.width, inline: mediaWidth };
    card.media.set(reported);
  }

  // Clear only this media's shape, in case another media replaced it.
  onMount(() => () => {
    card?.media.update((current) => (current === reported ? null : current));
  });

  $: mediaClass = ["bx--card__media", $$restProps.class]
    .filter(Boolean)
    .join(" ");
</script>

{#if $horizontal}
  <div
    class:bx--card__media={true}
    class:bx--card__media--horizontal={true}
    style:--ccs-card-media-width={mediaWidth}
    {...$$restProps}
  >
    <slot />
  </div>
{:else}
  <AspectRatio {ratio} fill {...$$restProps} class={mediaClass}>
    <slot />
  </AspectRatio>
{/if}
