<script lang="ts">
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "1", text: "Laptop", price: 999, category: "Electronics" },
    { id: "2", text: "Phone", price: 599, category: "Electronics" },
    { id: "3", text: "Desk", price: 299, category: "Furniture" },
  ];
</script>

<MultiSelect
  {items}
  label="Choose products"
  labelText="Products"
  on:select={(e) => {
    console.log("selected:", e.detail.selected);
  }}
  let:item
>
  {@const { text, price, category } = item}
  <div>
    <strong>{text}</strong> - ${price}
    <span>({category})</span>
  </div>
</MultiSelect>
