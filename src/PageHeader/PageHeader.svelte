<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @restProps {header}
   * @slot {{}} Page content rendered after the header. `TabContent` placed here pairs with the `Tabs` in the `tabs` slot.
   * @slot {{}} breadcrumb - A `Breadcrumb` with its `BreadcrumbItem`s.
   * @slot {{}} breadcrumbEnd - Small actions at the end of the breadcrumb row.
   * @slot {{}} titleChildren - Rich title content inside the heading. Overrides `title`.
   * @slot {{}} titleStart - An icon or `UserAvatar` before the title.
   * @slot {{}} titleEnd - A status `Tag`, indicator, or small actions after the title.
   * @slot {{}} description - Longer rich text below the subtitle.
   * @slot {{}} meta - Key facts between the title and the tabs, such as a `DescriptionList`, `BigNumber`s, or a `TagSet`.
   * @slot {{}} tabs - A `Tabs` with its `Tab`s and `TabContent`s.
   * @slot {{}} tabsEnd - Controls at the end of the tabs row, such as a time range `Dropdown`.
   * @slot {{}} actions - A `ButtonSet` or `ActionSet` with its `Button`s.
   */

  /**
   * Specify the page title.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Specify short eyebrow text above the title, such as the parent section
   * or resource type.
   * @type {string | undefined}
   */
  export let eyebrow = undefined;

  /**
   * Specify an icon to render before the eyebrow text.
   * @type {Icon}
   */
  export let eyebrowIcon = /** @type {Icon} */ (undefined);

  /**
   * Specify the page subtitle.
   * @type {string | undefined}
   */
  export let subtitle = undefined;

  /**
   * Set to `true` to stick the header to the top of its nearest scroll
   * container while the page scrolls, offset by `stickyOffset`. Reuses
   * `Box`'s own `position="sticky"` and `top` — see `Box.svelte`. There is
   * no collapse-on-scroll animation in this version.
   */
  export let sticky = false;

  /**
   * Set how far from the top of the scroll container a `sticky` header
   * sticks, such as `"3rem"` to clear a UI Shell `Header`. Numbers `0`–`13`
   * use the shared layout scale; strings accept any CSS length.
   * @type {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | string}
   */
  export let stickyOffset = 0;

  /**
   * Set the header background using a Carbon layer token. Use `"layer-01"`
   * to set the header apart from a `"background"` page body.
   * @type {"background" | "layer-01" | "layer-02"}
   */
  export let fill = "background";

  /**
   * Set to `true` to align the header, and the page body in the default
   * slot, with a `Grid`: the same max width, centering, and breakpoint
   * padding as a `Grid`'s container, so the title lines up with a
   * `Column`'s content. In this mode the body is the grid container, so
   * place `Row`s in it directly. Set to `"full-width"` to match a
   * `Grid fullWidth`, which drops the max width.
   * @type {boolean | "full-width"}
   */
  export let grid = false;

  /**
   * Specify the header size. `"sm"` uses a smaller title and tighter
   * vertical spacing, for nested or detail pages.
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /** Set to `true` to hide the border below the header. */
  export let hideDivider = false;

  /**
   * Obtain a reference to the rendered `<header>` element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import Box from "../Box/Box.svelte";
  import Heading from "../Heading/Heading.svelte";
  import Text from "../Text/Text.svelte";
  import PageHeaderBody from "./PageHeaderBody.svelte";

  /** The first `Tabs` slotted into the header, shared with the body. */
  let tabsContext = undefined;

  /** @type {null | HTMLElement} */
  let bodyRef = null;

  /**
   * The registered `Tabs`' `type`, reported by `Tabs` itself.
   * @type {undefined | "default" | "container"}
   */
  let tabsType = undefined;

  setContext("carbon:PageHeader", {
    /**
     * Returns the element holding the tab panels and a setter for the tabs'
     * `type`, or `undefined` when another `Tabs` already registered.
     */
    registerTabs: (context) => {
      if (tabsContext) return undefined;
      tabsContext = context;
      return {
        getBody: () => bodyRef,
        setType: (type) => {
          tabsType = type;
        },
      };
    },
    getTabs: () => tabsContext,
  });

  $: containerTabs = tabsType === "container";

  $: pageHeaderClass = [
    "bx--page-header",
    // Container tabs connect the selected tab to the surface below; a
    // divider would cut between them.
    !hideDivider && !containerTabs && "bx--page-header--divider",
    containerTabs && "bx--page-header--container-tabs",
    size === "sm" && "bx--page-header--sm",
    grid && "bx--page-header--grid",
    grid === "full-width" && "bx--page-header--grid-full-width",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Box
  {...$$restProps}
  bind:ref
  tag="header"
  {fill}
  position={sticky ? "sticky" : undefined}
  top={sticky ? stickyOffset : undefined}
  class={pageHeaderClass}
>
  <div class:bx--page-header__content={true}>
    {#if $$slots.breadcrumb || $$slots.breadcrumbEnd}
      <div class:bx--page-header__breadcrumb-row={true}>
        <slot name="breadcrumb" />
        {#if $$slots.breadcrumbEnd}
          <div class:bx--page-header__breadcrumb-end={true}>
            <slot name="breadcrumbEnd" />
          </div>
        {/if}
      </div>
    {/if}

    <div class:bx--page-header__title-row={true}>
      <div class:bx--page-header__title-group={true}>
        {#if eyebrow}
          <Text
            tag="div"
            type="label-01"
            color="secondary"
            class="bx--page-header__eyebrow"
          >
            {#if eyebrowIcon}
              <svelte:component this={eyebrowIcon} />
            {/if}
            <span>{eyebrow}</span>
          </Text>
        {/if}
        {#if title || $$slots.titleChildren || $$slots.titleStart || $$slots.titleEnd}
          <div class:bx--page-header__title-line={true}>
            {#if $$slots.titleStart}
              <div class:bx--page-header__title-start={true}>
                <slot name="titleStart" />
              </div>
            {/if}
            {#if title || $$slots.titleChildren}
              <Heading
                type={size === "sm"
                  ? "productive-heading-03"
                  : "productive-heading-04"}
                class="bx--page-header__title"
              >
                <slot name="titleChildren">{title}</slot>
              </Heading>
            {/if}
            {#if $$slots.titleEnd}
              <div class:bx--page-header__title-end={true}>
                <slot name="titleEnd" />
              </div>
            {/if}
          </div>
        {/if}
        {#if subtitle}
          <Text
            type="body-short-01"
            color="secondary"
            class="bx--page-header__subtitle"
          >
            {subtitle}
          </Text>
        {/if}
        {#if $$slots.description}
          <Text
            tag="div"
            type="body-long-01"
            class="bx--page-header__description"
          >
            <slot name="description" />
          </Text>
        {/if}
      </div>
      {#if $$slots.actions}
        <div class:bx--page-header__actions={true}>
          <slot name="actions" />
        </div>
      {/if}
    </div>

    {#if $$slots.meta}
      <div class:bx--page-header__meta={true}>
        <slot name="meta" />
      </div>
    {/if}

    {#if $$slots.tabs || $$slots.tabsEnd}
      <div
        class:bx--page-header__tabs-row={true}
        class:bx--page-header__tabs-row--with-end={$$slots.tabsEnd}
      >
        <slot name="tabs" />
        {#if $$slots.tabsEnd}
          <div class:bx--page-header__tabs-end={true}>
            <slot name="tabsEnd" />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</Box>

{#if $$slots.default}
  <PageHeaderBody bind:ref={bodyRef}>
    <slot />
  </PageHeaderBody>
{/if}
