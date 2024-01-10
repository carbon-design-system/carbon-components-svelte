<script>
  import { MultiSelect } from "carbon-components-svelte";
</script>

<MultiSelect
  titleText="Contact"
  label="Select contact methods..."
  items="{[
    { id: '0', text: 'Slack' },
    { id: '1', text: 'Email' },
    { id: '2', text: 'Fax' },
  ]}"
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
</MultiSelect>

<style>
  :global(.cds--list-box__menu-item, .cds--list-box__menu-item__option) {
    height: auto;
  }

  :global(.cds--checkbox-label-text) {
    display: block;
  }
</style>
