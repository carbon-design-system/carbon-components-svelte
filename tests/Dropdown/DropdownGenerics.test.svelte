<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  const items = [
    { id: "1", text: "Laptop", price: 999, category: "Electronics" },
    { id: "2", text: "Phone", price: 599, category: "Electronics" },
    { id: "3", text: "Desk", price: 299, category: "Furniture" },
  ] as const;

  export let onSelect: (detail: unknown) => void = () => {};
</script>

<Dropdown
  {items}
  selectedId="1"
  placeholder="Choose a product"
  labelText="Products"
  on:select={(e) => onSelect(e.detail)}
  let:item
>
  {@const { id, text, price, category } = item}
  <div>
    <strong>{text}</strong>
    - ${price}
    - {id}
    <span>({category})</span>
  </div>
</Dropdown>
