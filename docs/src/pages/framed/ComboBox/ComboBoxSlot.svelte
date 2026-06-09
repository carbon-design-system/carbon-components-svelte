<script>
  import { ComboBox } from "carbon-components-svelte";
</script>

<ComboBox
  labelText="Contact"
  placeholder="Select contact method"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
  let:item
  let:index
  let:selected
  let:highlighted
>
  <div>
    <strong>{item.text}</strong>
  </div>
  <div>
    id: {item.id} - index: {index} - selected: {selected} - highlighted:
    {highlighted}
  </div>
</ComboBox>

<style>
  :global(.bx--list-box__menu-item),
  :global(.bx--list-box__menu-item__option) {
    height: auto;
  }
</style>
