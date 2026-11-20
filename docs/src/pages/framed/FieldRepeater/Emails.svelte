<script>
  import { FieldRepeater, TextInput } from "carbon-components-svelte";

  let emails = ["ada@example.com"];
</script>

<FieldRepeater
  bind:items={emails}
  itemName="email"
  legendText="Notification emails"
  helperText="We send receipts to every address."
  hideItemLabel
  let:index
  let:label
>
  <TextInput labelText={label} type="email" bind:value={emails[index]} />
</FieldRepeater>
