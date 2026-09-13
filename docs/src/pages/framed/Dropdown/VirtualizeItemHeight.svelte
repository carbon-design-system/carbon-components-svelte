<script>
  import { Dropdown, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Ticket #${10000 + i}`,
    description: `Priority: ${["Low", "Medium", "High", "Critical"][i % 4]}`,
  }));

  let selectedId = 1000;
</script>

<Dropdown
  virtualize={{ itemHeight: 60 }}
  labelText="Custom item height (support tickets, 60px)"
  {items}
  bind:selectedId
  let:item
>
  <Stack gap={2}>
    <strong>{item.text}</strong>
    <span>{item.description}</span>
  </Stack>
</Dropdown>

<style>
  :global(.bx--list-box__menu-item),
  :global(.bx--list-box__menu-item__option) {
    height: auto;
  }
</style>
