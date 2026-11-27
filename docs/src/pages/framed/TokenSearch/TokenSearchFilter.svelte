<script>
  import { DataTable, Stack, TokenSearch } from "carbon-components-svelte";

  const keys = [
    { key: "status", type: "enum", values: ["open", "closed", "draft"] },
    { key: "label", type: "enum", values: ["bug", "ui", "docs"] },
    { key: "comments", type: "number" },
    { key: "title", type: "text" },
  ];

  const rows = [
    {
      id: 1,
      title: "Menu clips in a modal",
      status: "open",
      label: "bug",
      comments: 12,
    },
    {
      id: 2,
      title: "Document the date shortcuts",
      status: "open",
      label: "docs",
      comments: 2,
    },
    {
      id: 3,
      title: "Tabs lose focus on resize",
      status: "closed",
      label: "bug",
      comments: 7,
    },
    {
      id: 4,
      title: "Rounded corners on tags",
      status: "draft",
      label: "ui",
      comments: 0,
    },
    {
      id: 5,
      title: "Search menu flashes on open",
      status: "open",
      label: "ui",
      comments: 5,
    },
  ];

  /** Does `row` pass one filter of the query? */
  function passes(row, { key, op, values, negated }) {
    const cell = row[key];
    let hit;
    if (op === "eq") {
      hit = values.some((value) =>
        typeof cell === "number"
          ? cell === Number(value)
          : String(cell).toLowerCase().includes(value.toLowerCase()),
      );
    } else if (op === "between") {
      const [from, to] = values;
      hit =
        (from === "" || cell >= Number(from)) &&
        (to === "" || cell <= Number(to));
    } else {
      const bound = Number(values[0]);
      hit = {
        gt: cell > bound,
        gte: cell >= bound,
        lt: cell < bound,
        lte: cell <= bound,
      }[op];
    }
    return negated ? !hit : hit;
  }

  let value = "status:open comments:>=3";
  let query;

  $: shown = query
    ? rows.filter(
        (row) =>
          // Skip a filter with an error, so a half-typed query does not empty the table.
          query.filters
            .filter(
              (filter) =>
                !query.errors.some(
                  (e) => e.start >= filter.start && e.end <= filter.end,
                ),
            )
            .every((filter) => passes(row, filter)) &&
          row.title.toLowerCase().includes(query.text.toLowerCase()),
      )
    : rows;
</script>

<Stack gap={5}>
  <TokenSearch
    bind:value
    bind:query
    {keys}
    labelText="Filter issues"
    helperText="status:open label:bug,ui -label:docs comments:3..10 menu"
  />
  <DataTable
    size="short"
    headers={[
      { key: "title", value: "Title" },
      { key: "status", value: "Status" },
      { key: "label", value: "Label" },
      { key: "comments", value: "Comments" },
    ]}
    rows={shown}
  />
</Stack>
