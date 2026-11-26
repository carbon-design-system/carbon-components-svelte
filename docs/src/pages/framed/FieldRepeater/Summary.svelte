<script>
  import { FieldRepeater, Stack, TextInput } from "carbon-components-svelte";

  let contacts = [
    { name: "Ada Lovelace", email: "ada@example.com" },
    { name: "Grace Hopper", email: "grace@example.com" },
    { name: "Katherine Johnson", email: "katherine@example.com" },
  ];
</script>

<FieldRepeater
  bind:items={contacts}
  itemName="contact"
  legendText="Emergency contacts"
  summaryText={(contact) =>
    contact.name ? `${contact.name}, ${contact.email}` : "New contact"}
  createItem={() => ({ name: "", email: "" })}
  reorderable
  let:index
  let:id
>
  <Stack gap={5}>
    <TextInput
      id="{id}-name"
      labelText="Name"
      bind:value={contacts[index].name}
    />
    <TextInput
      id="{id}-email"
      labelText="Email"
      type="email"
      bind:value={contacts[index].email}
    />
  </Stack>
</FieldRepeater>
