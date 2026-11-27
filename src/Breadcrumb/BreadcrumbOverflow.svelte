<script>
  // Internal: the overflow menu `Breadcrumb` renders after its first item
  // when `overflow` is `"menu"`.

  /**
   * The hidden items, in order.
   * @type {{ text: string; href?: string; current?: "page" | "step" | "location" | "date" | "time" | "true" }[]}
   */
  export let items = [];

  /** @type {"sm" | "md"} */
  export let size = "md";

  /** Accessible name of the menu button */
  export let description = "";

  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import BreadcrumbItem from "./BreadcrumbItem.svelte";
</script>

<BreadcrumbItem class="bx--breadcrumb-item--overflow">
  <OverflowMenu
    size={size === "sm" ? "sm" : undefined}
    iconDescription={description}
  >
    {#each items as item, i (i)}
      <OverflowMenuItem
        text={item.text}
        href={item.href}
        aria-current={item.current}
      />
    {/each}
  </OverflowMenu>
</BreadcrumbItem>
