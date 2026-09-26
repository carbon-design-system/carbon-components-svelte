<script>
  /**
   * @restProps {div}
   */

  /** Set to `true` to render a breadcrumb placeholder above the title. */
  export let breadcrumb = false;

  /** Set to `false` to omit the subtitle placeholder. */
  export let subtitle = true;

  /** Set to `true` to render an action button placeholder. */
  export let actions = false;

  /** Specify the number of tab placeholders. `0` renders no tabs row. */
  export let tabs = 0;

  /**
   * Match the `PageHeader`'s `grid` so the placeholder lines up the same way.
   * @type {boolean | "full-width"}
   */
  export let grid = false;

  /**
   * Match the `PageHeader`'s `fill`.
   * @type {"background" | "layer-01" | "layer-02"}
   */
  export let fill = "background";

  /**
   * Match the `PageHeader`'s `size`.
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /** Match the `PageHeader`'s `hideDivider`. */
  export let hideDivider = false;

  import Box from "../Box/Box.svelte";
  import BreadcrumbSkeleton from "../Breadcrumb/BreadcrumbSkeleton.svelte";
  import ButtonSkeleton from "../Button/ButtonSkeleton.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import TabsSkeleton from "../Tabs/TabsSkeleton.svelte";

  $: skeletonClass = [
    "bx--page-header",
    "bx--page-header-skeleton",
    !hideDivider && "bx--page-header--divider",
    size === "sm" && "bx--page-header--sm",
    grid && "bx--page-header--grid",
    grid === "full-width" && "bx--page-header--grid-full-width",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Box {...$$restProps} {fill} class={skeletonClass}>
  <div class:bx--page-header__content={true}>
    {#if breadcrumb}
      <div class:bx--page-header__breadcrumb-row={true}>
        <BreadcrumbSkeleton noTrailingSlash />
      </div>
    {/if}

    <div class:bx--page-header__title-row={true}>
      <div class:bx--page-header__title-group={true}>
        <SkeletonText heading width="30%" />
        {#if subtitle}
          <SkeletonText width="50%" />
        {/if}
      </div>
      {#if actions}
        <div class:bx--page-header__actions={true}>
          <ButtonSkeleton />
        </div>
      {/if}
    </div>

    {#if tabs > 0}
      <div class:bx--page-header__tabs-row={true}>
        <TabsSkeleton count={tabs} />
      </div>
    {/if}
  </div>
</Box>
