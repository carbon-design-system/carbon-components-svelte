<script>
  import { PropertyInspector } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const params =
    typeof location === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(location.search);
  const count = Number(params.get("n") ?? 100);
  const total = Number(params.get("p") ?? 40);

  // 40 properties: mostly numbers, as in a design tool, and a few of the rest.
  const kinds = ["number", "number", "number", "text", "boolean", "select"];
  const properties = Array.from({ length: total }, (_, index) => {
    const type = kinds[index % kinds.length];
    return {
      id: `p${index}`,
      label: `Property ${index}`,
      type,
      group: `g${Math.floor(index / 10)}`,
      default: type === "number" ? 0 : undefined,
      options:
        type === "select"
          ? [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ]
          : undefined,
    };
  });
  const groups = Array.from({ length: Math.ceil(total / 10) }, (_, index) => ({
    id: `g${index}`,
    label: `Group ${index}`,
  }));

  function make(index) {
    const shape = { id: `s${index}` };
    for (const property of properties) {
      if (property.type === "number") shape[property.id] = index % 7;
      else if (property.type === "text") shape[property.id] = `t${index % 3}`;
      else if (property.type === "boolean")
        shape[property.id] = index % 2 === 0;
      else shape[property.id] = index % 2 ? "a" : "b";
    }
    return shape;
  }

  let shapes = Array.from({ length: count }, (_, index) => make(index));
  let selectedIds = ["s0"];
  let applied = 0;

  $: selection = shapes.filter((shape) => selectedIds.includes(shape.id));

  function handleInput(event) {
    applied++;
    const byId = new Map();
    for (const change of event.detail.changes) {
      const entry = byId.get(change.targetId) ?? {};
      entry[change.property] = change.newValue;
      byId.set(change.targetId, entry);
    }
    shapes = shapes.map((shape) =>
      byId.has(shape.id) ? { ...shape, ...byId.get(shape.id) } : shape,
    );
  }

  onMount(() => {
    window.__stress = {
      select(ids) {
        selectedIds = ids;
      },
      all() {
        selectedIds = shapes.map((shape) => shape.id);
      },
    };
  });
</script>

<div style="width: 20rem;">
  <PropertyInspector {properties} {groups} {selection} on:input={handleInput} />
</div>
<div data-testid="applied">{applied}</div>
