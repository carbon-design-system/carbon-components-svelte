<script>
  import { TreeSelect } from "carbon-components-svelte";

  const nodes = [
    {
      id: "europe",
      text: "Europe",
      nodes: [
        {
          id: "germany",
          text: "Germany",
          nodes: [
            { id: "berlin", text: "Berlin" },
            { id: "munich", text: "Munich" },
          ],
        },
        {
          id: "france",
          text: "France",
          nodes: [{ id: "paris", text: "Paris" }],
        },
      ],
    },
    {
      id: "north-america",
      text: "North America",
      nodes: [
        { id: "us", text: "United States" },
        { id: "canada", text: "Canada" },
      ],
    },
    { id: "antarctica", text: "Antarctica" },
  ];

  let selectedId = "munich";
  let checkedIds = ["france"];
  let indeterminateIds = [];
</script>

<TreeSelect
  labelText="Office"
  label="Choose an office"
  {nodes}
  bind:selectedId
  clearable
/>
<p>Selected: {selectedId ?? "none"}</p>

<TreeSelect
  labelText="Offices"
  label="Choose offices"
  {nodes}
  selectionMode="checkbox"
  bind:checkedIds
  bind:indeterminateIds
/>
<p>Checked: {checkedIds.join(", ") || "none"}</p>
<p>Partly checked: {indeterminateIds.join(", ") || "none"}</p>
