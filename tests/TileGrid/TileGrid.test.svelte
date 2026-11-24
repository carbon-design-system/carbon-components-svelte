<script lang="ts">
  import TileGrid from "carbon-components-svelte/TileGrid/TileGrid.svelte";
  import type { ComponentProps } from "svelte";

  type Service = { id: string; text: string; group?: string };

  export let items: Service[] = [
    { id: "functions", text: "Cloud Functions" },
    { id: "storage", text: "Object Storage" },
    { id: "secrets", text: "Secrets Manager" },
  ];
  export let props: Partial<ComponentProps<TileGrid<Service>>> = {};
  export let onClick: (detail: {
    id: unknown;
    item: Service;
  }) => void = () => {};
</script>

<TileGrid
  {items}
  labelText="Services"
  {...props}
  on:click:tile={(event) => onClick(event.detail)}
  let:item
>
  <span aria-hidden="true">{item.id}</span>
  <p slot="empty">No services</p>
</TileGrid>
