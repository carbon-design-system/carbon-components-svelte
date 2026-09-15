<script>
  import {
    applyColumnSettings,
    DataTable,
    LocalStorage,
    Toolbar,
    ToolbarColumnVisibility,
    ToolbarContent,
    toColumnSettings,
  } from "carbon-components-svelte";

  const defaultHeaders = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  let settings = toColumnSettings(defaultHeaders);

  $: headers = applyColumnSettings(defaultHeaders, settings);
</script>

<LocalStorage key="docs-column-settings" bind:value={settings} />

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarColumnVisibility
        {headers}
        on:change={(event) => (settings = event.detail.settings)}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>
