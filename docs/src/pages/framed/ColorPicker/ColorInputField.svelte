<script>
  import { ColorInput, Stack } from "carbon-components-svelte";

  const swatches = [
    { value: "#da1e28", label: "Red 60" },
    { value: "#24a148", label: "Green 50" },
    { value: "#0f62fe", label: "Blue 60" },
    { value: "#8a3ffc", label: "Purple 60" },
  ];

  let value = "#0f62fe";
</script>

<Stack gap={5}>
  <ColorInput
    bind:value
    {swatches}
    labelText="Brand color"
    helperText="Used for links and buttons"
  />
  <p>
    <code>value</code>: {value}
  </p>
</Stack>
