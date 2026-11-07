<script>
  import { PropertyInspector } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const groups = [
    { id: "layout", label: "Layout" },
    { id: "appearance", label: "Appearance" },
    { id: "text", label: "Text" },
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
      default: 0,
    },
    {
      id: "y",
      label: "Y",
      type: "number",
      group: "layout",
      row: "position",
      unit: "px",
      unitLabel: "pixels",
      default: 0,
    },
    {
      id: "width",
      label: "W",
      type: "number",
      group: "layout",
      row: "size",
      rowLabel: "Size",
      min: 1,
      unit: "px",
      unitLabel: "pixels",
      default: 100,
    },
    {
      id: "height",
      label: "H",
      type: "number",
      group: "layout",
      row: "size",
      min: 1,
      unit: "px",
      unitLabel: "pixels",
      default: 100,
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
      default: 0,
      appliesTo: (shape) => shape.kind === "rect",
    },
    {
      id: "visible",
      label: "Visible",
      type: "boolean",
      group: "appearance",
      default: true,
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
      id: "blend",
      label: "Blend",
      type: "select",
      group: "appearance",
      default: "normal",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
      ],
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
      id: "clip",
      label: "Clip content",
      type: "toggle",
      group: "appearance",
      default: false,
    },
    {
      id: "align",
      label: "Align",
      type: "radio",
      group: "text",
      default: "start",
      options: [
        { value: "start", label: "Start" },
        { value: "center", label: "Center" },
      ],
    },
    {
      id: "font",
      label: "Font",
      type: "dropdown",
      group: "text",
      default: "sans",
      options: [
        { value: "sans", label: "Sans" },
        { value: "serif", label: "Serif" },
        { value: "mono", label: "Mono" },
      ],
    },
    {
      id: "id",
      label: "Identifier",
      type: "text",
      group: "text",
      readOnly: true,
    },
  ];

  let shapes = [
    {
      id: "a",
      kind: "rect",
      name: "Card",
      x: 10,
      y: 20,
      width: 100,
      height: 60,
      rotation: 0,
      radius: 4,
      visible: true,
      opacity: 100,
      blend: "normal",
      fill: "#d0e2ff",
      stroke: "#0f62fe",
      clip: false,
      align: "start",
      font: "sans",
    },
    {
      id: "b",
      kind: "rect",
      name: "Banner",
      x: 40,
      y: 20,
      width: 200,
      height: 80,
      rotation: 0,
      radius: 4,
      visible: false,
      opacity: 80,
      blend: "multiply",
      fill: "#ffd6e8",
      stroke: "#0f62fe",
      clip: true,
      align: "center",
      font: "serif",
    },
    {
      id: "c",
      kind: "ellipse",
      name: "Badge",
      x: 70,
      y: 20,
      width: 40,
      height: 40,
      rotation: 15,
      visible: true,
      opacity: 100,
      blend: "normal",
      fill: "#d0e2ff",
      stroke: "#da1e28",
      clip: false,
      align: "start",
      font: "sans",
    },
  ];

  let selectedIds = ["a"];
  let log = [];
  let search = "";
  let undoStack = [];

  $: selection = shapes.filter((shape) => selectedIds.includes(shape.id));

  function handleInput(event) {
    const { changes } = event.detail;
    shapes = shapes.map((shape) => {
      const mine = changes.filter((change) => change.targetId === shape.id);
      if (!mine.length) return shape;
      return {
        ...shape,
        ...Object.fromEntries(
          mine.map((change) => [change.property, change.newValue]),
        ),
      };
    });
  }

  function handleChange(event) {
    const { source, transaction, property, changes } = event.detail;
    undoStack = [...undoStack, changes];
    log = [
      ...log,
      {
        source,
        transaction,
        property,
        changes: changes.map(({ targetId, property, oldValue, newValue }) => ({
          targetId,
          property,
          oldValue,
          newValue,
        })),
      },
    ];
  }

  function undo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    undoStack = undoStack.slice(0, -1);
    shapes = shapes.map((shape) => {
      const mine = last.filter((change) => change.targetId === shape.id);
      if (!mine.length) return shape;
      return {
        ...shape,
        ...Object.fromEntries(
          mine.map((change) => [change.property, change.oldValue]),
        ),
      };
    });
  }

  function select(ids) {
    selectedIds = ids;
  }

  // Lets a test change the selection without moving focus off a field.
  onMount(() => {
    window.__select = select;
  });
</script>

<div
  style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;"
>
  <div style="width: 20rem; max-width: 100%;">
    <PropertyInspector
      {properties}
      {groups}
      {selection}
      bind:search
      on:input={handleInput}
      on:change={handleChange}
    />
  </div>
  <div style="min-width: 0; flex: 1 1 12rem;">
    <button type="button" data-testid="select-a" on:click={() => select(["a"])}
      >Select Card</button
    >
    <button
      type="button"
      data-testid="select-ab"
      on:click={() => select(["a", "b"])}>Select Card and Banner</button
    >
    <button
      type="button"
      data-testid="select-abc"
      on:click={() => select(["a", "b", "c"])}>Select all</button
    >
    <button type="button" data-testid="select-none" on:click={() => select([])}
      >Select none</button
    >
    <button type="button" data-testid="undo" on:click={undo}>Undo</button>
    <pre
      data-testid="shapes"
      style="white-space: pre-wrap; word-break: break-all;">{JSON.stringify(
        shapes,
      )}</pre>
    <pre
      data-testid="log"
      style="white-space: pre-wrap; word-break: break-all;">{JSON.stringify(
        log,
      )}</pre>
  </div>
</div>
