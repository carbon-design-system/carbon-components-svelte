<script>
  /**
   * Put the page's live region in the layout, so it is in the server HTML
   * and the first paint, and a screen reader knows it before the first
   * `announce()`. Without it, `announce()` makes the region on the first
   * message and holds that message back for a moment.
   *
   * Place one near the root, outside any container that is `inert` or
   * `aria-hidden`.
   * @restProps {div}
   */

  import { onMount } from "svelte";
  import { getAnnouncer } from "../utils/announcer.js";

  /** @type {HTMLElement | undefined} */
  let region;

  onMount(() => {
    if (!region) return;
    return getAnnouncer().adopt(region);
  });
</script>

<div {...$$restProps} class:bx--visually-hidden={true} data-announcer="">
  <div
    bind:this={region}
    role="status"
    aria-live="polite"
    aria-atomic="false"
    aria-relevant="additions"
  ></div>
</div>
