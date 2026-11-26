<script>
  import {
    FieldRepeater,
    Select,
    SelectItem,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let members = [
    { name: "Ada Lovelace", role: "engineer" },
    { name: "Grace Hopper", role: "manager" },
  ];
</script>

<FieldRepeater
  bind:items={members}
  itemName="member"
  legendText="Team members"
  max={5}
  createItem={() => ({ name: "", role: "engineer" })}
  let:index
  let:id
>
  <Stack gap={5}>
    <TextInput
      id="{id}-name"
      labelText="Name"
      bind:value={members[index].name}
    />
    <Select id="{id}-role" labelText="Role" bind:selected={members[index].role}>
      <SelectItem value="engineer" text="Engineer" />
      <SelectItem value="designer" text="Designer" />
      <SelectItem value="manager" text="Manager" />
    </Select>
  </Stack>
</FieldRepeater>
