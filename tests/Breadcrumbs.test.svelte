<script lang="ts">
  type Items = { href?: string; text: string }[];

  export let items: Items = [
    { href: "/", text: "Dashboard" },
    { href: "/reports", text: "Annual reports" },
    { href: "/reports/2019", text: "2019" },
  ];

  import { Row, Column, Breadcrumb, BreadcrumbItem } from "../types";
</script>

<Row>
  <Column>
    <Breadcrumb>
      {#each items as item, i}
        <BreadcrumbItem
          href="{item.href}"
          isCurrentPage="{i === items.length - 1}"
        >
          {item.text}
        </BreadcrumbItem>
      {/each}
    </Breadcrumb>
  </Column>
</Row>
