<script>
  import { AutoComplete } from "carbon-components-svelte";

  let items = [];

  fetch("https://restcountries.com/v3.1/all?fields=name,ccn3")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed!");
      }
      return res.json();
    })
    .then((data) => {
      let _items = [];
      Object.values(data).forEach((country) => {
        _items.push({ id: country.ccn3, text: country.name.common });
      });

      items = _items;

      return items;
    })
    .catch((err) => {
      console.log(err);
    });

  function filteredItems(value) {
    return value
      ? items.filter((country) => country.text.startsWith(value))
      : [];
  }
</script>

<AutoComplete
  titleText="Contact"
  selectedId="0"
  shouldFilterItem="{filteredItems}"
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
</AutoComplete>

<style>
  :global(.bx--list-box__menu-item, .bx--list-box__menu-item__option) {
    height: auto;
  }
</style>
