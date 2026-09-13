<script>
  import { ComboBox } from "carbon-components-svelte";
</script>

<ComboBox
  labelText="Alert channel"
  placeholder="Select alert channel"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Webhook" },
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
