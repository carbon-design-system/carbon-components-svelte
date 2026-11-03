<script>
  import { IconPicker, Stack, toIconItems } from "carbon-components-svelte";
  import {
    Add,
    Calendar,
    Chat,
    Edit,
    Home,
    Notification,
    Save,
    Settings,
    TrashCan,
    User,
    Warning,
  } from "carbon-icons-svelte";

  // Every Carbon icon, in a module that loads when the picker needs it.
  const everything = () =>
    import("./all-icons").then((module) => module.default);

  const curated = toIconItems(
    {
      Add,
      Edit,
      Save,
      TrashCan,
      Calendar,
      Chat,
      Notification,
      Home,
      Settings,
      User,
      Warning,
    },
    {
      category: (id) =>
        ["Add", "Edit", "Save", "TrashCan"].includes(id)
          ? "actions"
          : ["Chat", "Notification", "Warning"].includes(id)
            ? "communication"
            : "general",
    },
  );
  const categories = [
    { id: "actions", label: "Actions" },
    { id: "communication", label: "Communication" },
    { id: "general", label: "General" },
  ];

  let value = "Add";
  let curatedValue;
  let inlineValue = "Home";
  let recent = ["Chat"];
  let changes = [];
  let open = false;
</script>

<Stack gap={7}>
  <div data-testid="basic" style:width="320px" style:max-width="100%">
    <IconPicker
      bind:value
      bind:recent
      bind:open
      items={everything}
      labelText="Icon"
      helperText="Every Carbon icon"
      on:change={({ detail }) =>
        (changes = [...changes, `${detail.value}:${typeof detail.icon}`])}
    />
  </div>
  <div data-testid="curated" style:width="320px" style:max-width="100%">
    <IconPicker
      bind:value={curatedValue}
      items={curated}
      {categories}
      labelText="Curated"
      searchLabelText="Search curated"
      name="curated-icon"
    />
  </div>
  <div data-testid="invalid" style:width="320px" style:max-width="100%">
    <IconPicker
      items={curated}
      labelText="Invalid"
      invalid
      invalidText="Choose an icon"
      searchLabelText="Search invalid"
    />
  </div>
  <div data-testid="disabled" style:width="320px" style:max-width="100%">
    <IconPicker items={curated} value="Save" labelText="Disabled" disabled />
  </div>
  <div data-testid="inline">
    <IconPicker
      variant="inline"
      bind:value={inlineValue}
      items={curated}
      {categories}
      labelText="Inline"
      searchLabelText="Search inline"
    />
  </div>
  {#each [16, 20, 32] as iconSize}
    <div
      data-testid="size-{iconSize}"
      style:width="320px"
      style:max-width="100%"
    >
      <IconPicker
        items={curated}
        {categories}
        {iconSize}
        value="Edit"
        labelText="Icon size {iconSize}"
        searchLabelText="Search size {iconSize}"
      />
    </div>
  {/each}
  <output data-testid="value">{value}</output>
  <output data-testid="recent">{recent.join(",")}</output>
  <output data-testid="changes">{changes.join(",")}</output>
  <output data-testid="open">{open}</output>
</Stack>
