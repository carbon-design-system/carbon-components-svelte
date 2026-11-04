<script>
  import { PickerGrid, Stack } from "carbon-components-svelte";

  const categories = [
    { id: "animals", label: "Animals" },
    { id: "food", label: "Food" },
    { id: "travel", label: "Travel" },
    { id: "objects", label: "Objects" },
  ];
  const names = {
    animals: ["Cat", "Dog", "Fox", "Owl", "Bear", "Wolf", "Seal", "Crab"],
    food: [
      "Apple",
      "Bread",
      "Cheese",
      "Donut",
      "Grape",
      "Honey",
      "Lemon",
      "Mango",
    ],
    travel: ["Bike", "Boat", "Bus", "Car", "Plane", "Train", "Tram", "Taxi"],
    objects: ["Book", "Clock", "Key", "Lamp", "Pen", "Phone", "Ring", "Tent"],
  };

  /** 4 categories x 60 items, so the grid has to window. */
  const items = categories.flatMap(({ id }) =>
    Array.from({ length: 60 }, (_, i) => ({
      id: `${id}-${i}`,
      label: `${names[id][i % 8]} ${Math.floor(i / 8) + 1}`,
      category: id,
      keywords: [id],
      disabled: id === "objects" && i === 3,
    })),
  );

  let selectedId;
  let chosen = "objects-50";
  let selectedIds = ["animals-1", "travel-2"];
  let recent = ["travel-4", "animals-0"];
  let events = [];
  let windows = 0;
</script>

<Stack gap={7}>
  <div data-testid="basic" style:width="360px" style:max-width="100%">
    <PickerGrid
      {items}
      {categories}
      bind:selectedId
      bind:recent
      labelText="Things"
      searchLabelText="Search things"
      columns={8}
      on:select={({ detail }) => (events = [...events, detail.id])}
      on:window:change={() => (windows += 1)}
    />
  </div>
  <div data-testid="multi" style:width="360px" style:max-width="100%">
    <PickerGrid
      {items}
      {categories}
      selectionMode="multiple"
      bind:selectedIds
      recentLimit={0}
      labelText="Multiple"
      searchLabelText="Search multiple"
    />
  </div>
  <div data-testid="plain" style:width="360px" style:max-width="100%">
    <PickerGrid
      {items}
      searchable={false}
      recentLimit={0}
      labelText="Plain"
      height={200}
    />
  </div>
  <div data-testid="narrow" style:width="200px" style:max-width="100%">
    <PickerGrid
      {items}
      {categories}
      recentLimit={0}
      labelText="Narrow"
      searchLabelText="Search narrow"
    />
  </div>
  <div data-testid="empty" style:width="360px" style:max-width="100%">
    <PickerGrid items={[]} labelText="Empty" searchLabelText="Search empty" />
  </div>
  <div data-testid="chosen" style:width="360px" style:max-width="100%">
    <PickerGrid
      {items}
      {categories}
      bind:selectedId={chosen}
      recentLimit={0}
      labelText="Chosen"
      searchLabelText="Search chosen"
    />
  </div>
  <output data-testid="selected">{selectedId}</output>
  <output data-testid="selected-ids">{selectedIds.join(",")}</output>
  <output data-testid="recent">{recent.join(",")}</output>
  <output data-testid="events">{events.join(",")}</output>
  <output data-testid="windows">{windows}</output>
</Stack>
