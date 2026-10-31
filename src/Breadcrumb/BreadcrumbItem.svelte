<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * Spread `props` onto a custom element to inherit the link class
   * and `aria-current` attribute when `isCurrentPage` is set.
   * @example
   * ```svelte
   * <BreadcrumbItem let:props>
   *   <a {...props} href="/">Home</a>
   * </BreadcrumbItem>
   * ```
   * @restProps {li}
   * @slot {{props?: { "aria-current"?: boolean | "true" | "false" | "page" | "step" | "location" | "date" | "time"; class: "bx--link"; }}}
   */

  /**
   * Set the `href` to use an anchor link.
   * @type {string | undefined}
   */
  export let href = undefined;

  /** Set to `true` if the breadcrumb item represents the current page */
  export let isCurrentPage = false;

  /**
   * Specify the icon to render before the label.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the `<li>` element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, setContext } from "svelte";
  import Link from "../Link/Link.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";

  setContext("carbon:BreadcrumbItem", {});

  const { separator: separatorStore } = getContext("carbon:Breadcrumb");

  $: ({ "aria-current": ariaCurrent, ...liProps } = $$restProps);
  // With an `href`, naming and description belong on the link, not the `li`.
  // Without one there is no built-in focusable element, so they stay put.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: linkItemProps,
  } = splitAriaNaming(liProps));
</script>

<li
  bind:this={ref}
  class:bx--breadcrumb-item={true}
  class:bx--breadcrumb-item--current={isCurrentPage || ariaCurrent === "page"}
  {...href ? linkItemProps : liProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if href}
    <Link
      {href}
      aria-current={ariaCurrent ?? (isCurrentPage ? "page" : undefined)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {#if $$slots.icon || icon}
        <div class:bx--breadcrumb-item__icon={true}>
          <slot name="icon"><svelte:component this={icon} /></slot>
        </div>
      {/if}
      <slot />
    </Link>
  {:else}
    {#if $$slots.icon || icon}
      <div class:bx--breadcrumb-item__icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    <slot
      props={{
        "aria-current": ariaCurrent ?? (isCurrentPage ? "page" : undefined),
        class: "bx--link",
      }}
    />
  {/if}
  {#if typeof $separatorStore !== "string"}
    <span class:bx--breadcrumb-item__separator={true} aria-hidden="true">
      <svelte:component this={$separatorStore} />
    </span>
  {/if}
</li>
