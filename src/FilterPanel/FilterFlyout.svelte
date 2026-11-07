<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   * @slot {{ flyout: boolean }}
   * @restProps {aside}
   */

  /**
   * Set to `true` to open the flyout. It has no effect while the filters sit
   * inline.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the smallest Carbon breakpoint that keeps the filters inline.
   * Below it they move into a `SidePanel`. Set `"sm"` to keep them inline
   * everywhere.
   * @type {"sm" | "md" | "lg" | "xlg" | "max"}
   */
  export let breakpoint = "lg";

  /**
   * Whether the filters are in the flyout now. It is `false` until the
   * browser reports its width, so the server writes the inline layout.
   * @type {boolean}
   * @bindable readonly
   */
  export let flyout = false;

  /** Specify the flyout's title, and the inline region's name. */
  export let title = "Filters";

  /**
   * Specify the flyout's width.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "sm";

  /**
   * Obtain a reference to the inline region. It is `null` in the flyout.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { observeBreakpoint } from "../Breakpoint/breakpoint-observer.js";
  import { breakpoints } from "../Breakpoint/breakpoints.js";
  import SidePanel from "../SidePanel/SidePanel.svelte";

  // The panel inside names itself with the side panel's title instead.
  const inFlyout = writable(false);
  setContext("carbon:FilterFlyout", inFlyout);
  $: $inFlyout = flyout;

  onMount(() =>
    observeBreakpoint((current) => {
      flyout = breakpoints[current] < breakpoints[breakpoint];
      if (!flyout) open = false;
    }),
  );
</script>

{#if flyout}
  <SidePanel
    bind:open
    {title}
    {size}
    placement="start"
    includeOverlay
    {...$$restProps}
    on:close
  >
    <slot {flyout} />
  </SidePanel>
{:else}
  <aside
    bind:this={ref}
    aria-label={title}
    {...$$restProps}
    class:bx--filter-flyout={true}
  >
    <slot {flyout} />
  </aside>
{/if}
