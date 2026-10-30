<script lang="ts">
  import QueryBuilder from "carbon-components-svelte/QueryBuilder/QueryBuilder.svelte";
  import type {
    QueryField,
    QueryGroup,
  } from "carbon-components-svelte/QueryBuilder/QueryBuilder.svelte";
  import type { ComponentProps } from "svelte";
  import { queryToJSON } from "../../src/QueryBuilder/query.js";

  export const fields: QueryField[] = [
    { id: "name", text: "Name", kind: "text" },
    { id: "seats", text: "Seats", kind: "number", min: 0, max: 100 },
    { id: "renewal", text: "Renewal date", kind: "date" },
    {
      id: "plan",
      text: "Plan",
      kind: "option",
      options: [
        { id: "free", text: "Free" },
        { id: "team", text: "Team" },
      ],
    },
    { id: "active", text: "Active", kind: "boolean" },
  ];

  export let value: QueryGroup = { operator: "and", conditions: [] };
  export let maxDepth = 3;
  export let readonly = false;
  export let showErrors = false;
  export let showSummary = false;
  export let disabled = false;
  export let invalid = false;
  export let invalidText = "";
  export let helperText = "";
  export let translateWithId: ComponentProps<QueryBuilder>["translateWithId"] =
    undefined;
  export let onchange: (detail: QueryGroup) => void = () => {};
  export let onmove: (event: CustomEvent) => void = () => {};
  export let onremove: (event: CustomEvent) => void = () => {};
</script>

<QueryBuilder
  id="qb"
  labelText="Filter"
  {fields}
  bind:value
  {maxDepth}
  {readonly}
  {showErrors}
  {showSummary}
  {disabled}
  {invalid}
  {invalidText}
  {helperText}
  {...translateWithId ? { translateWithId } : {}}
  on:change={(event) => onchange(event.detail)}
  on:move={onmove}
  on:remove={onremove}
/>
<pre data-testid="bound">{queryToJSON(value)}</pre>
<pre data-testid="bound-ids">{queryToJSON(value, { ids: true })}</pre>
