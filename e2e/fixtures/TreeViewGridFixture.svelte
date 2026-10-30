<script>
  import {
    Link,
    OverflowMenu,
    OverflowMenuItem,
    Tag,
    Toggle,
    TreeViewGrid,
  } from "carbon-components-svelte";
  import Cloud from "carbon-icons-svelte/lib/Cloud.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  // `?size=short&zebra&sticky&multiselect&tab` pick a variant.
  const params = new URLSearchParams(
    typeof location === "undefined" ? "" : location.search,
  );
  const size = params.get("size") ?? undefined;
  const widgetNavigation = params.has("tab") ? "tab" : "arrow";

  const headers = [
    { key: "name", value: "Name" },
    { key: "status", value: "Status", width: "8rem" },
    { key: "owner", value: "Owner" },
    { key: "cost", value: "Cost", columnAlign: "end", width: "7rem" },
    { key: "scale", value: "Auto scale", width: "8rem" },
    { key: "actions", value: "Actions", width: "6rem" },
  ];

  const nodes = [
    {
      id: "us-east",
      name: "US East",
      icon: Cloud,
      status: "active",
      owner: "Platform",
      cost: 1820.5,
      nodes: [
        {
          id: "us-east-api",
          name: "api",
          icon: Folder,
          status: "active",
          owner: "Payments",
          cost: 640,
          nodes: [
            {
              id: "us-east-api-1",
              name: "api-1",
              status: "active",
              owner: "Payments",
              cost: 320,
            },
            {
              id: "us-east-api-2",
              name: "api-2",
              status: "degraded",
              owner: "Payments",
              cost: 320,
            },
            {
              id: "us-east-api-canary",
              name: "api-canary-failover-replica-2026-10-29",
              status: "active",
              owner: "Payments",
              cost: 80,
            },
          ],
        },
        {
          id: "us-east-db",
          name: "db (locked)",
          icon: Folder,
          disabled: true,
          status: "active",
          owner: "Data",
          cost: 980,
        },
        {
          id: "us-east-cache",
          name: "cache",
          status: "stopped",
          owner: "Platform",
          cost: 200.5,
        },
      ],
    },
    {
      id: "eu-west",
      name: "EU West",
      icon: Cloud,
      status: "degraded",
      owner: "Platform",
      cost: 940,
      nodes: [
        {
          id: "eu-west-api",
          name: "api",
          icon: Folder,
          status: "degraded",
          owner: "Payments",
          cost: 940,
        },
      ],
    },
    {
      id: "ap-south",
      name: "AP South",
      icon: Cloud,
      status: "stopped",
      owner: "Growth",
      cost: 0,
    },
  ];

  const kinds = { active: "green", degraded: "red", stopped: "gray" };
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let expandedIds = ["us-east"];
  let selectedIds = [];
  let activeId = "";
  let scaled = {};
</script>

<TreeViewGrid
  data-testid="tree-view-grid"
  labelText="Cloud resources"
  {size}
  {headers}
  {nodes}
  {widgetNavigation}
  zebra={params.has("zebra")}
  stickyHeader={params.has("sticky")}
  stickyHeaderMaxHeight={params.has("sticky") ? 220 : undefined}
  multiselect={params.has("multiselect")}
  bind:expandedIds
  bind:selectedIds
  bind:activeId
>
  <svelte:fragment slot="cell" let:node let:cell>
    {#if cell.key === "status"}
      <Tag size="sm" type={kinds[node.status]} disabled={node.disabled}
        >{node.status}</Tag
      >
    {:else if cell.key === "owner"}
      <Link href="#{node.owner}" disabled={node.disabled}>{node.owner}</Link>
    {:else if cell.key === "cost"}
      {money.format(cell.value)}
    {:else if cell.key === "scale"}
      <Toggle
        size="sm"
        hideLabel
        labelText="Auto scale {node.name}"
        disabled={node.disabled}
        bind:toggled={scaled[node.id]}
      />
    {:else if cell.key === "actions"}
      <OverflowMenu
        size="sm"
        flipped
        disabled={node.disabled}
        iconDescription="Actions for {node.name}"
      >
        <OverflowMenuItem text="Restart" />
        <OverflowMenuItem text="Delete" danger />
      </OverflowMenu>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</TreeViewGrid>

<output data-testid="selected">{selectedIds.join(",")}</output>
<output data-testid="expanded">{expandedIds.join(",")}</output>
