<script>
  /**
   * Put the app's two live regions in the layout, so they are in the first
   * paint and a screen reader knows them before the first `announce()`.
   * Without it, `announce()` makes the regions on the first message and waits
   * a moment before it writes to them.
   *
   * Place one near the root, outside any container that is `inert` or
   * `aria-hidden`.
   * @restProps {div}
   */

  import { onMount } from "svelte";
  import { getAnnouncer } from "../utils/announcer.js";

  /** @type {HTMLElement | undefined} */
  let polite;

  /** @type {HTMLElement | undefined} */
  let assertive;

  onMount(() => {
    if (!polite) return;
    return getAnnouncer().adopt({ polite, assertive });
  });
</script>

<div {...$$restProps} class:bx--visually-hidden={true} data-announcer="">
  <div
    bind:this={polite}
    role="status"
    aria-live="polite"
    aria-atomic="false"
    aria-relevant="additions"
  ></div>
  <div
    bind:this={assertive}
    role="alert"
    aria-live="assertive"
    aria-atomic="false"
    aria-relevant="additions"
  ></div>
</div>
