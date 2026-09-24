<script>
  /**
   * @template [Separator=any]
   */

  /** @extends {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

  /**
   * Set to `true` to hide the separator after the last breadcrumb item
   */
  export let noTrailingSlash = false;

  /** Set to `true` to display skeleton state */
  export let skeleton = false;

  /** Specify the ARIA label for the nav */
  export let labelText = "Breadcrumb";

  /**
   * Specify the size of the breadcrumb.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify the separator rendered between breadcrumb items.
   * Accepts a text character, rendered through CSS, or a component
   * reference (for example an icon or pictogram component), rendered as
   * a decorative DOM node.
   * @type {string | Separator}
   * @example
   * ```svelte
   * <Breadcrumb separator={ArrowRight}>
   * ```
   */
  export let separator = /** @type {string | Separator} */ ("/");

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";

  const separatorStore = writable(separator);

  $: separatorStore.set(separator);

  setContext("carbon:Breadcrumb", { separator: separatorStore });
</script>

{#if skeleton}
  <BreadcrumbSkeleton
    {noTrailingSlash}
    {size}
    {separator}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <nav
    aria-label={labelText}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <ol
      class:bx--breadcrumb={true}
      class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}
      class:bx--breadcrumb--sm={size === "sm"}
      class:bx--breadcrumb--separator-icon={typeof separator !== "string"}
      style:--ccs-separator={typeof separator === "string"
        ? `'${separator}'`
        : "''"}
    >
      <slot />
    </ol>
  </nav>
{/if}
