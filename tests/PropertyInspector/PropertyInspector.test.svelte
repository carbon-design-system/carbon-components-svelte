<script lang="ts">
  import PropertyInspector from "carbon-components-svelte/PropertyInspector/PropertyInspector.svelte";
  import type { ComponentProps } from "svelte";

  type Shape = Record<string, unknown> & { id: string };

  export let selection: Shape[] = [];
  export let search = "";
  export let properties: ComponentProps<PropertyInspector>["properties"] = [
    { id: "name", label: "Name", type: "text", group: "a" },
    {
      id: "x",
      label: "X",
      type: "number",
      group: "a",
      row: "pos",
      rowLabel: "Position",
      unit: "px",
      unitLabel: "pixels",
      default: 0,
    },
    { id: "y", label: "Y", type: "number", group: "a", row: "pos", default: 0 },
    { id: "on", label: "On", type: "boolean", group: "b", default: true },
    { id: "flip", label: "Flip", type: "toggle", group: "b" },
    {
      id: "blend",
      label: "Blend",
      type: "select",
      group: "b",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
      ],
    },
    {
      id: "font",
      label: "Font",
      type: "dropdown",
      group: "b",
      options: [
        { value: "sans", label: "Sans" },
        { value: "serif", label: "Serif" },
      ],
    },
    {
      id: "align",
      label: "Align",
      type: "radio",
      group: "b",
      options: [
        { value: "start", label: "Start" },
        { value: "end", label: "End" },
      ],
    },
    { id: "fill", label: "Fill", type: "color", group: "b" },
    { id: "locked", label: "Locked", type: "text", group: "b", readOnly: true },
    {
      id: "radius",
      label: "Radius",
      type: "number",
      group: "b",
      appliesTo: (shape: Shape) => shape.kind === "rect",
    },
  ];
  export let onInput: (detail: unknown) => void = () => {};
  export let onChange: (detail: unknown) => void = () => {};
</script>

<PropertyInspector
  {properties}
  {selection}
  bind:search
  groups={[
    { id: "a", label: "Layout" },
    { id: "b", label: "Style", open: false },
  ]}
  on:input={(event) => onInput(event.detail)}
  on:change={(event) => onChange(event.detail)}
/>
