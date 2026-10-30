<script lang="ts">
  import { ColorPicker } from "carbon-components-svelte";

  const swatches = [
    { value: "#da1e28", label: "Red 60" },
    { value: "#ff832b", label: "Orange 40" },
    { value: "#f1c21b", label: "Yellow 30" },
    { value: "#24a148", label: "Green 50" },
    { value: "#009d9a", label: "Teal 50" },
    { value: "#0f62fe", label: "Blue 60" },
    { value: "#8a3ffc", label: "Purple 60" },
    { value: "#d02670", label: "Magenta 60" },
    { value: "#161616", label: "Gray 100" },
    { value: "#8d8d8d", label: "Gray 50" },
    { value: "#e0e0e0", label: "Gray 20" },
    { value: "#ffffff", label: "White" },
  ];

  let value = "#0f62fe";
  let format: "hex" | "rgb" | "hsl" = "hex";
  let recent: string[] = [];
  let alphaValue = "rgba(15, 98, 254, 0.5)";
  let changes = 0;
</script>

<div data-testid="basic" style="width: 20rem; padding: 1rem">
  <ColorPicker
    bind:value
    bind:format
    bind:recent
    {swatches}
    on:change={() => (changes += 1)}
  />
</div>
<output data-testid="value">{value}</output>
<output data-testid="changes">{changes}</output>
<output data-testid="recent">{recent.join(" ")}</output>

<div data-testid="alpha" style="width: 20rem; padding: 1rem">
  <ColorPicker
    bind:value={alphaValue}
    alpha
    format="rgb"
    background="#ffffff"
    minContrast={3}
    aria-label="Alpha color"
  />
</div>
<output data-testid="alpha-value">{alphaValue}</output>

<div data-testid="disabled" style="width: 20rem; padding: 1rem">
  <ColorPicker
    value="#0f62fe"
    alpha
    format="rgb"
    disabled
    aria-label="Disabled color"
  />
</div>
