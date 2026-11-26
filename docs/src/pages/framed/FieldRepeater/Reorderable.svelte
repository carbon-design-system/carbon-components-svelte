<script>
  import { FieldRepeater, TextInput } from "carbon-components-svelte";

  let approvers = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson"];
</script>

<FieldRepeater
  bind:items={approvers}
  itemName="approver"
  legendText="Approvers, in order"
  helperText="The first approver reviews the request first."
  reorderable
  hideItemLabel
  let:index
  let:label
>
  <TextInput labelText={label} bind:value={approvers[index]} />
</FieldRepeater>
