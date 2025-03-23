<script lang="ts">
import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";

type BreadcrumbItemType = { href?: string; text: string };

export let items: BreadcrumbItemType[] = [
  { href: "/", text: "Dashboard" },
  { href: "/reports", text: "Annual reports" },
  { href: "/reports/2019", text: "2019" },
];
</script>

<Breadcrumb>
  {#each items as item, i}
    <BreadcrumbItem href={item.href} isCurrentPage={i === items.length - 1}>
      {item.text}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>
