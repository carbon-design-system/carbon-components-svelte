<script>
  import { ComboBox, Highlight, matchText } from "carbon-components-svelte";

  let value = "";

  const items = [
    { id: "0", text: "Café Central" },
    { id: "1", text: "Crème Brûlée Bakery" },
    { id: "2", text: "Çiçek Florist" },
    { id: "3", text: "İstanbul Kitchen" },
    { id: "4", text: "Müller Straße 5" },
    { id: "5", text: "Naïve Studio" },
  ];

  // One matcher filters the items and marks them: typing "cafe" finds
  // "Café Central", and "istanbul" finds "İstanbul Kitchen".
  const shouldFilterItem = (item, value) =>
    !value || matchText(item.text, value, { terms: "all" }).length > 0;
</script>

<ComboBox
  bind:value
  labelText="Place"
  placeholder="Search for a place"
  {shouldFilterItem}
  {items}
  let:item
>
  <Highlight text={item.text} query={value} />
</ComboBox>
