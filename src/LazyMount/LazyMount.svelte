<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} placeholder
   */

  /**
   * Dispatched once, after the content first renders.
   * @event {null} mount
   */

  /**
   * Specify when the content mounts.
   * `"visible"` mounts it once the wrapper comes within `rootMargin` of the viewport.
   * `"idle"` mounts it once the browser is idle, or sooner if it comes that close.
   * @type {"visible" | "idle"}
   */
  export let when = "visible";

  /**
   * Specify how far outside the viewport counts as near, as a CSS margin.
   * Content mounts before it scrolls into view, so it is ready when it does.
   */
  export let rootMargin = "600px";

  /**
   * Specify the height to reserve until the content mounts, so the page
   * doesn't shift when it does. A number is in pixels.
   * @type {number | string | undefined}
   */
  export let estimatedHeight = undefined;

  /**
   * Set to `true` to render the content right away, for example in tests or
   * before printing. Content also mounts on `beforeprint`.
   */
  export let eager = false;

  /**
   * `true` once the content has mounted. Mounted content stays mounted.
   * @bindable readonly
   */
  export let mounted = eager;

  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { noop } from "../utils/noop.js";
  import { observeIntersection } from "../utils/shared-observer.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLDivElement} */
  let ref = null;
  let ready = false;
  let dispatched = false;
  let stopWaiting = noop;

  function stop() {
    stopWaiting();
    stopWaiting = noop;
  }

  function show() {
    stop();
    mounted = true;
  }

  $: if (eager && !mounted) show();

  // Wait again whenever the trigger changes, until the content mounts.
  $: if (ready && !mounted && ref) {
    stop();
    stopWaiting = wait(ref, when, rootMargin);
  }

  /**
   * @param {HTMLDivElement} element
   * @param {"visible" | "idle"} trigger
   * @param {string} margin
   * @returns {() => void}
   */
  function wait(element, trigger, margin) {
    // Without IntersectionObserver there is no way to tell, so render.
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(show);
      return noop;
    }
    const stops = [
      observeIntersection(
        element,
        (entry) => {
          if (entry.isIntersecting) show();
        },
        { rootMargin: margin },
      ),
      addPooledListener("beforeprint", show),
    ];
    if (trigger === "idle") {
      if (typeof requestIdleCallback === "function") {
        const handle = requestIdleCallback(show);
        stops.push(() => cancelIdleCallback(handle));
      } else {
        const handle = setTimeout(show, 1);
        stops.push(() => clearTimeout(handle));
      }
    }
    return () => {
      for (const stop of stops) stop();
    };
  }

  afterUpdate(() => {
    if (mounted && !dispatched) {
      dispatched = true;
      dispatch("mount");
    }
  });

  onMount(() => {
    ready = true;
    return stop;
  });
</script>

<div
  bind:this={ref}
  style:min-height={mounted ? undefined : toCssLength(estimatedHeight)}
  {...$$restProps}
>
  {#if mounted}
    <slot />
  {:else}
    <slot name="placeholder" />
  {/if}
</div>
