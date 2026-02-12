<script lang="ts">
  import { Button, ComboBox, Dropdown, Theme } from "carbon-components-svelte";

  const items = [
    { id: "1", text: "Option 1" },
    { id: "2", text: "Option 2" },
    { id: "3", text: "Option 3" },
  ] as const;
</script>

<Dropdown data-testid="dropdown-snippet" {items} selectedId="1">
  {#snippet children({ item, index })}
    <span data-testid="dropdown-item-{index}">{item.text} (#{index})</span>
  {/snippet}
</Dropdown>

<Dropdown data-testid="dropdown-label-children" {items} selectedId="1">
  <span slot="labelChildren" data-testid="dropdown-custom-label">Custom label content</span>
</Dropdown>

<ComboBox data-testid="combobox-snippet" {items}>
  {#snippet children({ item, index })}
    <span data-testid="combobox-item-{index}">{item.text} - index {index}</span>
  {/snippet}
</ComboBox>

<Button data-testid="button-snippet" as>
  {#snippet children({ props })}
    <div {...props} data-testid="custom-button">Custom Button Element</div>
  {/snippet}
</Button>

<div data-testid="theme-snippet">
  <Theme>
    {#snippet children({ theme })}
      <div data-testid="theme-value">Current theme: {theme}</div>
    {/snippet}
  </Theme>
</div>
