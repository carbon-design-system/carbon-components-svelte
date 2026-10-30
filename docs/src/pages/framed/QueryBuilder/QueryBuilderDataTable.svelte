<script>
  import {
    DataTable,
    evaluateQuery,
    QueryBuilder,
    Stack,
  } from "carbon-components-svelte";

  const fields = [
    { id: "name", text: "Account", kind: "text" },
    { id: "seats", text: "Seats", kind: "number", min: 0 },
    { id: "renewal", text: "Renewal date", kind: "date" },
    {
      id: "region",
      text: "Region",
      kind: "option",
      options: [
        { id: "us-east", text: "US East" },
        { id: "eu-west", text: "EU West" },
        { id: "ap-south", text: "Asia Pacific" },
      ],
    },
    { id: "active", text: "Active", kind: "boolean" },
  ];

  const regionNames = Object.fromEntries(
    fields[3].options.map((option) => [option.id, option.text]),
  );

  const headers = [
    { key: "name", value: "Account" },
    { key: "seats", value: "Seats" },
    { key: "renewal", value: "Renewal date" },
    {
      key: "region",
      value: "Region",
      display: (region) => regionNames[region],
    },
    {
      key: "active",
      value: "Active",
      display: (active) => (active ? "Yes" : "No"),
    },
  ];

  const names = [
    "Acme",
    "Globex",
    "Initech",
    "Umbrella",
    "Hooli",
    "Stark",
    "Wayne",
    "Wonka",
  ];
  const regions = ["us-east", "eu-west", "ap-south"];

  const allRows = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    name: `${names[i % names.length]} ${["Corp", "Labs", "Cloud", "Systems", "Group"][i % 5]}`,
    seats: 5 + ((i * 37) % 400),
    renewal: `2026-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + ((i * 7) % 28)).padStart(2, "0")}`,
    region: regions[i % 3],
    active: i % 4 !== 0,
  }));

  let value = {
    operator: "and",
    conditions: [
      { field: "active", operator: "is", value: true },
      {
        operator: "or",
        conditions: [
          { field: "seats", operator: "gte", value: 200 },
          { field: "region", operator: "is", value: "eu-west" },
        ],
      },
    ],
  };

  // The table filters by what is complete so far, so it narrows as the
  // query is built.
  $: rows = allRows.filter((row) => evaluateQuery(value, row, fields));
</script>

<Stack gap={6}>
  <QueryBuilder labelText="Filter accounts" showSummary {fields} bind:value />
  <DataTable
    title="Accounts"
    description="{rows.length} of {allRows.length} accounts match"
    size="short"
    {headers}
    {rows}
  />
</Stack>
