<script>
  import { Dropdown } from "carbon-components-svelte";
</script>

<Dropdown
  labelText="Contact"
  selectedId="0"
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
  let:item
  let:index
>
  <div>
    <strong>{item.text}</strong>
  </div>
  <div>
    id: {item.id} - index:
    {index}
  </div>
</Dropdown>

<style>
  :global(.bx--list-box__menu-item, .bx--list-box__menu-item__option) {
    height: auto;
  }
</style>
