<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarDensity from "carbon-components-svelte/DataTable/ToolbarDensity.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<ToolbarDensity>["size"] = undefined;
  export let sizes: ComponentProps<ToolbarDensity>["sizes"] = undefined;
  export let formatLabel: ComponentProps<ToolbarDensity>["formatLabel"] =
    undefined;
  export let icon: ComponentProps<ToolbarDensity>["icon"] = undefined;
  export let tableSize: ComponentProps<DataTable>["size"] = undefined;
  export let standalone = false;
</script>

<p>Size: {size}</p>

{#if standalone}
  <Toolbar>
    <ToolbarContent>
      <ToolbarDensity
        bind:size
        {sizes}
        {formatLabel}
        {icon}
        on:change={({ detail }) => console.log("change", detail)}
      />
    </ToolbarContent>
  </Toolbar>
{:else}
  <DataTable
    size={tableSize}
    headers={[{ key: "name", value: "Name" }]}
    rows={[{ id: "a", name: "Row A" }]}
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarDensity
          bind:size
          {sizes}
          {formatLabel}
          {icon}
          on:change={({ detail }) => console.log("change", detail)}
        />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
{/if}
