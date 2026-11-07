<script>
  import { FieldRepeater, TextInput } from "carbon-components-svelte";

  let links = [];
</script>

<FieldRepeater
  bind:items={links}
  itemName="link"
  legendText="Social links"
  addText="Add a link"
  hideItemLabel
  let:index
  let:label
>
  <TextInput labelText={label} type="url" bind:value={links[index]} />
  <p slot="empty">
    No links yet. Add your profiles, such as GitHub or LinkedIn.
  </p>
</FieldRepeater>
