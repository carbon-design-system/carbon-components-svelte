<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";

  const few = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    text: `Option ${i + 1}`,
  }));
  // Past the 100-item threshold, so the menu virtualizes.
  const many = Array.from({ length: 500 }, (_, i) => ({
    id: String(i),
    text: `Option ${i + 1}`,
  }));

  const modes = [
    { mode: "in-place", items: few, portalMenu: false },
    { mode: "portal", items: few, portalMenu: true },
    { mode: "virtualized", items: many, portalMenu: false },
  ];
  const components = [
    { name: "dropdown", component: Dropdown },
    { name: "combobox", component: ComboBox },
    { name: "multiselect", component: MultiSelect },
  ];
</script>

<!-- Every menu opens at once, so each cell leaves room below its field. -->
<div data-testid="grid" class="grid">
  {#each components as { name, component } (name)}
    {#each modes as { mode, items, portalMenu } (mode)}
      <div data-testid="{name}-{mode}" class="cell">
        <svelte:component
          this={component}
          labelText="{name} {mode}"
          {items}
          {portalMenu}
          open
          maxHeight="10rem"
        />
      </div>
    {/each}
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 14rem));
    gap: 1rem;
    padding: 1rem;
  }

  .cell {
    height: 15rem;
  }
</style>
