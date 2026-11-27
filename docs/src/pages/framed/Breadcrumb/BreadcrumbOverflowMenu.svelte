<script>
  import {
    Box,
    Breadcrumb,
    BreadcrumbItem,
    Slider,
    Stack,
  } from "carbon-components-svelte";

  const items = [
    { href: "/", text: "Home" },
    { href: "/reports", text: "Annual reports" },
    { href: "/reports/2019", text: "2019" },
    { href: "/reports/2019/q4", text: "Fourth quarter" },
    { href: "/reports/2019/q4/revenue", text: "Revenue by region" },
    { href: "/reports/2019/q4/revenue/emea", text: "Europe" },
  ];

  let width = 320;
</script>

<Stack gap={6}>
  <Slider
    labelText="Container width"
    min={200}
    max={640}
    step={20}
    bind:value={width}
  />
  <Box maxWidth={width}>
    <Breadcrumb overflow="menu">
      {#each items as item, i}
        <BreadcrumbItem href={item.href} isCurrentPage={i === items.length - 1}>
          {item.text}
        </BreadcrumbItem>
      {/each}
    </Breadcrumb>
  </Box>
</Stack>
