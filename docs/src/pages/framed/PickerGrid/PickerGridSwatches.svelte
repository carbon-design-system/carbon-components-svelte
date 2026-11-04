<script>
  import { Box, PickerGrid } from "carbon-components-svelte";

  const swatches = [
    { id: "red-60", label: "Red 60", color: "#da1e28" },
    { id: "magenta-60", label: "Magenta 60", color: "#d02670" },
    { id: "purple-60", label: "Purple 60", color: "#8a3ffc" },
    { id: "blue-60", label: "Blue 60", color: "#0f62fe" },
    { id: "cyan-50", label: "Cyan 50", color: "#1192e8" },
    { id: "teal-50", label: "Teal 50", color: "#009d9a" },
    { id: "green-50", label: "Green 50", color: "#24a148" },
    { id: "yellow-30", label: "Yellow 30", color: "#f1c21b" },
    { id: "orange-40", label: "Orange 40", color: "#ff832b" },
    { id: "gray-60", label: "Gray 60", color: "#6f6f6f" },
  ];

  let selectedId = "blue-60";
</script>

<Box maxWidth="22rem">
  <PickerGrid
    items={swatches}
    bind:selectedId
    searchable={false}
    labelText="Tag colors"
    columns={5}
    cellSize={48}
    height={96}
  >
    <svelte:fragment slot="cell" let:item>
      <!-- A color is the example here, so it sets the swatch's color directly. -->
      <span
        style:background-color={item.color}
        style:display="block"
        style:width="24px"
        style:height="24px"
        style:border-radius="50%"
        style:box-shadow="inset 0 0 0 1px rgba(0, 0, 0, 0.2)"
      ></span>
    </svelte:fragment>
    <svelte:fragment slot="preview" let:item>
      {item.label}
    </svelte:fragment>
  </PickerGrid>
</Box>
