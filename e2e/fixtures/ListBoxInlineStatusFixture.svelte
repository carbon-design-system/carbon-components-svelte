<script>
  import { Dropdown, MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "EU Germany" },
    { id: "b", text: "US East" },
  ];
</script>

{#each [{ invalid: true, invalidText: "Fix this" }, { warn: true, warnText: "Check this" }] as status, i (i)}
  <div data-status={status.invalid ? "invalid" : "warn"}>
    <Dropdown
      type="inline"
      labelText="Region"
      {items}
      selectedId="a"
      {...status}
    />
    <Dropdown
      type="inline"
      clearable
      labelText="Region"
      {items}
      selectedId="a"
      {...status}
    />
    <MultiSelect
      type="inline"
      labelText="Regions"
      {items}
      selectedIds={["a"]}
      {...status}
    />
  </div>
{/each}

<div data-status="none">
  <Dropdown type="inline" clearable labelText="Region" {items} selectedId="a" />
</div>
