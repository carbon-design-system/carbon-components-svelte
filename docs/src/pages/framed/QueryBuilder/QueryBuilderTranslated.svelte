<script>
  import { QueryBuilder } from "carbon-components-svelte";

  const fields = [
    { id: "name", label: "Nombre", kind: "text" },
    { id: "seats", label: "Puestos", kind: "number", min: 0 },
  ];

  const text = {
    where: "Donde",
    and: "y",
    or: "o",
    matchAll: "Todas las condiciones",
    matchAny: "Cualquier condición",
    addCondition: "Agregar condición",
    addGroup: "Agregar grupo",
    summaryLabel: "Leer como texto",
    summary: "Donde {text}",
    "op.contains": "contiene",
    "op.gte": "es al menos",
  };

  // An id missing here keeps its English default.
  function translateWithId(id, values) {
    return text[id]?.replace(/\{(\w+)\}/g, (_, key) => values?.[key] ?? "");
  }

  let value = {
    operator: "and",
    conditions: [
      { field: "name", operator: "contains", value: "Norte" },
      { field: "seats", operator: "gte", value: 20 },
    ],
  };
</script>

<QueryBuilder
  labelText="Filtro"
  showSummary
  {fields}
  {translateWithId}
  bind:value
/>
