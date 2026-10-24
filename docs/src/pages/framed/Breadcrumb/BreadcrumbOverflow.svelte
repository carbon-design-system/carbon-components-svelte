<script>
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";

  const items = [
    { href: "/", text: "Home" },
    { href: "/level-1", text: "Level 1" },
    { href: "/level-1/level-2", text: "Level 2" },
    { href: "/level-1/level-2/level-3", text: "Level 3" },
    { href: "/level-1/level-2/level-3/level-4", text: "Level 4" },
    { href: "/level-1/level-2/level-3/level-4/current", text: "Current page" },
  ];
</script>

<div style="max-width: 20rem;">
  <Breadcrumb enableOverflow>
    {#each items as item, i}
      <BreadcrumbItem href={item.href} isCurrentPage={i === items.length - 1}>
        {item.text}
      </BreadcrumbItem>
    {/each}
  </Breadcrumb>
</div>
