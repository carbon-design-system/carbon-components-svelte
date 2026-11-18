<script>
  import {
    Box,
    Button,
    PropertyInspector,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const groups = [
    { id: "layout", label: "Layout" },
    { id: "appearance", label: "Appearance" },
  ];

  const properties = [
    { id: "name", label: "Name", type: "text", group: "layout" },
    {
      id: "x",
      label: "X",
      type: "number",
      group: "layout",
      row: "position",
      rowLabel: "Position",
      unit: "px",
      unitLabel: "pixels",
    },
    {
      id: "y",
      label: "Y",
      type: "number",
      group: "layout",
      row: "position",
      unit: "px",
      unitLabel: "pixels",
    },
    {
      id: "width",
      label: "W",
      type: "number",
      group: "layout",
      row: "size",
      rowLabel: "Size",
      min: 4,
      unit: "px",
      unitLabel: "pixels",
    },
    {
      id: "height",
      label: "H",
      type: "number",
      group: "layout",
      row: "size",
      min: 4,
      unit: "px",
      unitLabel: "pixels",
      lockWith: "width",
    },
    {
      id: "rotation",
      label: "Rotation",
      type: "number",
      group: "layout",
      min: -180,
      max: 180,
      unit: "°",
      unitLabel: "degrees",
      default: 0,
    },
    {
      id: "radius",
      label: "Corner radius",
      type: "number",
      group: "layout",
      min: 0,
      unit: "px",
      unitLabel: "pixels",
      default: 0,
      appliesTo: (shape) => shape.kind === "rect",
    },
    {
      id: "opacity",
      label: "Opacity",
      type: "number",
      group: "appearance",
      min: 0,
      max: 100,
      unit: "%",
      unitLabel: "percent",
      default: 100,
    },
    {
      id: "fill",
      label: "Fill",
      type: "color",
      group: "appearance",
      default: "#d0e2ff",
    },
    {
      id: "stroke",
      label: "Stroke",
      type: "color",
      group: "appearance",
      default: "#0f62fe",
    },
    {
      id: "strokeWidth",
      label: "Stroke width",
      type: "number",
      group: "appearance",
      min: 0,
      max: 20,
      unit: "px",
      unitLabel: "pixels",
      default: 2,
    },
  ];

  const base = {
    radius: 0,
    rotation: 0,
    opacity: 100,
    strokeWidth: 2,
    stroke: "#0f62fe",
  };

  let shapes = [
    {
      ...base,
      id: "card",
      kind: "rect",
      name: "Billing card",
      x: 24,
      y: 28,
      width: 150,
      height: 90,
      radius: 8,
      fill: "#d0e2ff",
    },
    {
      ...base,
      id: "banner",
      kind: "rect",
      name: "Status banner",
      x: 196,
      y: 40,
      width: 200,
      height: 60,
      radius: 0,
      fill: "#a7f0ba",
      stroke: "#198038",
    },
    {
      ...base,
      id: "badge",
      kind: "ellipse",
      name: "Region badge",
      x: 60,
      y: 150,
      width: 90,
      height: 90,
      fill: "#ffd6e8",
      stroke: "#9f1853",
    },
    {
      ...base,
      id: "alert",
      kind: "ellipse",
      name: "Alert dot",
      x: 236,
      y: 164,
      width: 64,
      height: 64,
      fill: "#ffd7d9",
      stroke: "#da1e28",
    },
  ];

  let selectedIds = ["card"];
  let undoStack = [];
  let redoStack = [];
  let last = "No edits yet";

  $: selection = shapes.filter((shape) => selectedIds.includes(shape.id));

  function patch(changes, key) {
    const byId = new Map();
    for (const change of changes) {
      const entry = byId.get(change.targetId) ?? {};
      entry[change.property] = change[key];
      byId.set(change.targetId, entry);
    }
    shapes = shapes.map((shape) =>
      byId.has(shape.id) ? { ...shape, ...byId.get(shape.id) } : shape,
    );
  }

  // `input` fires for every step of a drag, so the canvas follows live.
  function handleInput(event) {
    patch(event.detail.changes, "newValue");
  }

  // `change` fires once when an edit is done: one undo step.
  function handleChange(event) {
    const { changes, source, property } = event.detail;
    undoStack = [...undoStack, changes];
    redoStack = [];
    last = `${property} · ${source} · ${changes.length} change${changes.length === 1 ? "" : "s"}`;
  }

  function undo() {
    const changes = undoStack[undoStack.length - 1];
    if (!changes) return;
    undoStack = undoStack.slice(0, -1);
    redoStack = [...redoStack, changes];
    patch(changes, "oldValue");
  }

  function redo() {
    const changes = redoStack[redoStack.length - 1];
    if (!changes) return;
    redoStack = redoStack.slice(0, -1);
    undoStack = [...undoStack, changes];
    patch(changes, "newValue");
  }

  function select(id, additive) {
    if (!additive) selectedIds = [id];
    else if (selectedIds.includes(id))
      selectedIds = selectedIds.filter((other) => other !== id);
    else selectedIds = [...selectedIds, id];
  }

  function handleKeydown(event, id) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(id, event.shiftKey);
    }
  }
</script>

<Stack gap={5} orientation="horizontal">
  <Stack gap={4}>
    <Box border="subtle">
      <svg
        viewBox="0 0 420 270"
        width="420"
        height="270"
        role="group"
        aria-label="Canvas. Select a shape; Shift selects several."
      >
        {#each shapes as shape (shape.id)}
          {@const selected = selectedIds.includes(shape.id)}
          {@const cx = shape.x + shape.width / 2}
          {@const cy = shape.y + shape.height / 2}
          <g
            role="button"
            tabindex="0"
            aria-pressed={selected}
            aria-label={shape.name}
            opacity={shape.opacity / 100}
            transform="rotate({shape.rotation} {cx} {cy})"
            on:click={(event) => select(shape.id, event.shiftKey)}
            on:keydown={(event) => handleKeydown(event, shape.id)}
          >
            {#if shape.kind === "rect"}
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.radius}
                fill={shape.fill}
                stroke={shape.stroke}
                stroke-width={shape.strokeWidth}
              />
            {:else}
              <ellipse
                {cx}
                {cy}
                rx={shape.width / 2}
                ry={shape.height / 2}
                fill={shape.fill}
                stroke={shape.stroke}
                stroke-width={shape.strokeWidth}
              />
            {/if}
            {#if selected}
              <rect
                x={shape.x - 4}
                y={shape.y - 4}
                width={shape.width + 8}
                height={shape.height + 8}
                fill="none"
                stroke="currentColor"
                stroke-dasharray="4 3"
              />
            {/if}
          </g>
        {/each}
      </svg>
    </Box>
    <Stack gap={3} orientation="horizontal">
      <Button
        size="small"
        kind="tertiary"
        disabled={!undoStack.length}
        on:click={undo}
      >
        Undo
      </Button>
      <Button
        size="small"
        kind="tertiary"
        disabled={!redoStack.length}
        on:click={redo}
      >
        Redo
      </Button>
      <Button
        size="small"
        kind="ghost"
        on:click={() => (selectedIds = shapes.map((shape) => shape.id))}
      >
        Select all
      </Button>
      <Button size="small" kind="ghost" on:click={() => (selectedIds = [])}>
        Select none
      </Button>
    </Stack>
    <Text
      >Last change: {last} · {undoStack.length} undo step{undoStack.length === 1
        ? ""
        : "s"}</Text
    >
  </Stack>
  <Box width="20rem" border="subtle">
    <PropertyInspector
      {properties}
      {groups}
      {selection}
      on:input={handleInput}
      on:change={handleChange}
    />
  </Box>
</Stack>
