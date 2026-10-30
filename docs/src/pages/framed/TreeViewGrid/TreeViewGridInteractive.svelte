<script>
  import {
    Link,
    OverflowMenu,
    OverflowMenuItem,
    TextInput,
    Toggle,
    TreeViewGrid,
  } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Name" },
    { key: "owner", value: "Owner" },
    { key: "note", value: "Note" },
    { key: "scale", value: "Auto scale", width: "9rem" },
    { key: "actions", value: "Actions", width: "6rem" },
  ];

  let nodes = [
    {
      id: "us-east",
      text: "US East",
      owner: "Platform",
      note: "Primary",
      nodes: [
        {
          id: "us-east-api",
          text: "payments-api",
          owner: "Payments",
          note: "",
        },
        {
          id: "us-east-db",
          text: "ledger-db",
          owner: "Data",
          note: "Locked",
          disabled: true,
        },
      ],
    },
    { id: "eu-west", text: "EU West", owner: "Platform", note: "" },
  ];

  let scaled = {};
</script>

<TreeViewGrid
  labelText="Cloud resources"
  size="medium"
  {headers}
  {nodes}
  expandedIds={["us-east"]}
>
  <svelte:fragment slot="cell" let:node let:cell>
    {#if cell.key === "owner"}
      <Link href="#{node.owner}" disabled={node.disabled}>{node.owner}</Link>
    {:else if cell.key === "note"}
      <TextInput
        size="sm"
        hideLabel
        labelText="Note for {node.text}"
        disabled={node.disabled}
        bind:value={node.note}
      />
    {:else if cell.key === "scale"}
      <Toggle
        size="sm"
        hideLabel
        labelText="Auto scale {node.text}"
        disabled={node.disabled}
        bind:toggled={scaled[node.id]}
      />
    {:else if cell.key === "actions"}
      <OverflowMenu
        size="sm"
        flipped
        disabled={node.disabled}
        iconDescription="Actions for {node.text}"
      >
        <OverflowMenuItem text="Restart" />
        <OverflowMenuItem text="Delete" danger />
      </OverflowMenu>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</TreeViewGrid>
