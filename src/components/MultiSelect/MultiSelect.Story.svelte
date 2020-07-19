<script>
  import Layout from "../../internal/ui/Layout.svelte";
  import { Button } from "../Button";
  import MultiSelect from "./MultiSelect.svelte";

  $: value = "";
  $: selectedIds = [];
  $: items = [
    { id: "option-0", text: "Option 1" },
    { id: "option-1", text: "Option 2" },
    { id: "option-2", text: "Option 3" },
    { id: "option-3", text: "Option 4" },
    {
      id: "option-4",
      text:
        "An example option that is really long to show what should be done to handle long text"
    }
  ];
</script>

<Layout>
  <div>
    <Button
      size="small"
      on:click={() => {
        selectedIds = selectedIds.length > 0 ? [] : [items[1].id, items[2].id];
      }}>
      {selectedIds.length > 0 ? 'Clear' : 'Set initial'} selected items
    </Button>
  </div>
  <div style="width: 300px; margin-top: 2rem;">
    <MultiSelect
      {...$$props}
      id="multi-select-id"
      name="multi-select-name"
      placeholder="Filter..."
      bind:selectedIds
      bind:items
      bind:value />
  </div>
</Layout>
