<script>
  import {
    Button,
    DataTable,
    DatePicker,
    DatePickerInput,
    TooltipDefinition,
  } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "renewal", value: "Renewal" },
    { key: "actions", empty: true },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 3", protocol: "HTTP" },
    { id: "b", name: "Load Balancer 1", protocol: "HTTPS" },
  ];
</script>

<DataTable {headers} {rows}>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "protocol"}
      <TooltipDefinition
        tooltipText={cell.value === "HTTPS"
          ? "HTTP over TLS, encrypted end to end"
          : "Plain HTTP, not encrypted"}
      >
        {cell.value}
      </TooltipDefinition>
    {:else if cell.key === "renewal"}
      <DatePicker datePickerType="single">
        <DatePickerInput
          size="sm"
          hideLabel
          labelText="Renewal date for {row.name}"
          placeholder="mm/dd/yyyy"
        />
      </DatePicker>
    {:else if cell.key === "actions"}
      <Button
        kind="ghost"
        size="small"
        icon={Edit}
        iconDescription="Edit {row.name}"
        tooltipAlignment="end"
      />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
