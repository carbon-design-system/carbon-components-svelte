<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  const items = [
    { id: "1", text: "Laptop", price: 999, category: "Electronics" },
    { id: "2", text: "Phone", price: 599, category: "Electronics" },
    { id: "3", text: "Desk", price: 299, category: "Furniture" },
  ] as const;

  export let onSelect: (detail: unknown) => void = () => {};
</script>

<ComboBox
  {items}
  labelText="Products"
  placeholder="Select a product"
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
</ComboBox>
