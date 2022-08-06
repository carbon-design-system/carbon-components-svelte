<script>
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";

  const items = [
    { href: "/", text: "Dashboard" },
    { href: "/reports", text: "Annual reports" },
    { href: "/reports/2019", text: "2019" },
  ];
</script>

<Breadcrumb>
  {#each items as item, i}
    <BreadcrumbItem href="{item.href}" isCurrentPage="{i === items.length - 1}">
      {item.text}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>
