<script>
  import { MultiSelect, Stack, Tag, TagSet } from "carbon-components-svelte";

  const items = [
    { id: "us-east", text: "US East" },
    { id: "us-south", text: "US South" },
    { id: "eu-de", text: "EU Germany" },
    { id: "jp-tok", text: "Tokyo" },
  ];

  let selectedIds = ["us-east", "eu-de"];

  $: selectedItems = items.filter((item) => selectedIds.includes(item.id));

  function handleTagClose({ detail }) {
    selectedIds = selectedIds.filter((id) => id !== detail.tag.value);
  }
</script>

<Stack gap={5}>
  <MultiSelect
    bind:selectedIds
    labelText="Regions"
    label="Select regions..."
    {items}
  />
  <TagSet navigation="roving" multiline on:close:tag={handleTagClose}>
    {#each selectedItems as item (item.id)}
      <Tag type="blue" value={item.id} filter>{item.text}</Tag>
    {/each}
  </TagSet>
</Stack>
