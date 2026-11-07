<script>
  import { SchemaForm } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import CountingTextWidget from "./CountingTextWidget.svelte";

  // ?sections=10&per=20 builds a JSON Schema with that many fields;
  // ?rows=50 adds an array with that many starting rows.
  const params = new URLSearchParams(location.search);
  const sections = Number(params.get("sections") ?? 10);
  const per = Number(params.get("per") ?? 20);
  const rowCount = Number(params.get("rows") ?? 0);
  const t0 = performance.now();

  const kinds = [
    { type: "string", minLength: 2 },
    { type: "integer", minimum: 0, maximum: 1000 },
    { type: "string", enum: ["a", "b", "c"] },
    { type: "boolean" },
  ];

  const properties = {};
  for (let s = 0; s < sections; s++) {
    const section = {};
    for (let i = 0; i < per; i++) {
      section[`f${i}`] = {
        title: `Field ${s}.${i}`,
        ...kinds[i % kinds.length],
      };
    }
    properties[`s${s}`] = {
      type: "object",
      title: `Section ${s}`,
      properties: section,
    };
  }
  if (rowCount) {
    properties.rows = {
      type: "array",
      title: "Rows",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", title: "Name" },
          qty: { type: "integer", title: "Quantity", minimum: 1 },
          note: { type: "string", title: "Note" },
        },
      },
    };
  }
  const schema = { type: "object", properties };
  const initialValues = rowCount
    ? {
        rows: Array.from({ length: rowCount }, (_, i) => ({
          name: `row ${i}`,
          qty: i + 1,
          note: "",
        })),
      }
    : {};

  let form;
  $: if (form) window.__sfForm = form;

  onMount(() => {
    requestAnimationFrame(() => {
      window.__sfReadyMs = performance.now() - t0;
    });
  });
</script>

<div data-testid="schema-form">
  <SchemaForm
    {schema}
    {initialValues}
    widgets={{ text: CountingTextWidget }}
    bind:form
    hideActions
  />
</div>
