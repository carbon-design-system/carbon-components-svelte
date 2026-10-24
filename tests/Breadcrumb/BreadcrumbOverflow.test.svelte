<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";

  type BreadcrumbItemType = { href?: string; text: string };

  export let items: BreadcrumbItemType[] = [
    { href: "/", text: "Home" },
    { href: "/level-1", text: "Level 1" },
    { href: "/level-1/level-2", text: "Level 2" },
    { href: "/level-1/level-2/level-3", text: "Level 3" },
    { href: "/level-1/level-2/level-3/current", text: "Current" },
  ];
</script>

<Breadcrumb enableOverflow>
  {#each items as item, i}
    <BreadcrumbItem href={item.href} isCurrentPage={i === items.length - 1}>
      {item.text}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>
