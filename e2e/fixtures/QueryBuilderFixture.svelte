<script>
  import { QueryBuilder, queryToJSON } from "carbon-components-svelte";

  const params = new URLSearchParams(window.location.search);
  const preset = params.get("preset") ?? "nested";
  const showErrors = params.get("errors") === "1";
  const readonly = params.get("readonly") === "1";
  const disabled = params.get("disabled") === "1";
  const invalid = params.get("invalid") === "1";
  const size = params.get("size") === "sm" ? "sm" : "md";
  const count = Number(params.get("count") ?? 0);

  const fields = [
    { id: "name", text: "Name", kind: "text", placeholder: "Search names" },
    { id: "seats", text: "Seats", kind: "number", min: 0, max: 10000 },
    { id: "renewal", text: "Renewal date", kind: "date" },
    {
      id: "plan",
      text: "Plan",
      kind: "option",
      options: [
        { id: "free", text: "Free" },
        { id: "team", text: "Team" },
        { id: "enterprise", text: "Enterprise" },
      ],
    },
    { id: "active", text: "Active", kind: "boolean" },
  ];

  function nested() {
    return {
      operator: "and",
      conditions: [
        { field: "name", operator: "contains", value: "Acme" },
        {
          operator: "or",
          conditions: [
            { field: "seats", operator: "gte", value: 50 },
            {
              field: "plan",
              operator: "isAnyOf",
              value: ["team", "enterprise"],
            },
            {
              operator: "and",
              conditions: [
                { field: "active", operator: "is", value: true },
                { field: "renewal", operator: "before", value: "2027-01-01" },
              ],
            },
          ],
        },
      ],
    };
  }

  function many(n) {
    const conditions = [];
    for (let i = 0; i < n; i++) {
      const kind = i % 5;
      conditions.push(
        kind === 0
          ? { field: "name", operator: "contains", value: `term ${i}` }
          : kind === 1
            ? { field: "seats", operator: "gt", value: i }
            : kind === 2
              ? { field: "renewal", operator: "after", value: "2026-01-01" }
              : kind === 3
                ? { field: "plan", operator: "is", value: "team" }
                : { field: "active", operator: "is", value: true },
      );
    }
    return { operator: "and", conditions };
  }

  const presets = {
    nested,
    empty: () => ({ operator: "and", conditions: [] }),
    many: () => many(count || 50),
    incomplete: () => ({
      operator: "and",
      conditions: [{ field: "name", operator: "contains", value: "" }],
    }),
  };

  let value = (presets[preset] ?? nested)();
  let changes = 0;
</script>

<div id="host">
  <QueryBuilder
    id="qb"
    {fields}
    bind:value
    {showErrors}
    {readonly}
    {disabled}
    {invalid}
    invalidText="Add a condition on the plan."
    {size}
    showSummary
    labelText="Account filter"
    helperText="Match accounts by any field."
    on:change={() => (changes += 1)}
  />
  <p data-testid="changes">{changes}</p>
  <!-- Wraps, so the one-line JSON does not widen the page. -->
  <pre
    data-testid="json"
    style="white-space: pre-wrap; overflow-wrap: anywhere">{queryToJSON(
      value,
    )}</pre>
</div>
