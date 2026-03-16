<script>
  import { MultiSelect } from "carbon-components-svelte";
</script>

<MultiSelect
  filterable
  labelText="Roles"
  placeholder="Filter roles..."
  items={[
    { id: "select-all", text: "All roles", isSelectAll: true },
    { id: "editor", text: "Editor" },
    { id: "owner", text: "Owner" },
    { id: "uploader", text: "Uploader" },
    { id: "reader", text: "Reader", disabled: true },
  ]}
/>
