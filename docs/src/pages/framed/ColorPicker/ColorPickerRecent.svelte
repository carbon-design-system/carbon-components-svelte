<script>
  import { ColorPicker, Stack } from "carbon-components-svelte";

  const swatches = [
    { value: "#da1e28", label: "Red 60" },
    { value: "#ff832b", label: "Orange 40" },
    { value: "#f1c21b", label: "Yellow 30" },
    { value: "#24a148", label: "Green 50" },
    { value: "#009d9a", label: "Teal 50" },
    { value: "#0f62fe", label: "Blue 60" },
    { value: "#8a3ffc", label: "Purple 60" },
    { value: "#d02670", label: "Magenta 60" },
  ];

  let value = "#0f62fe";
  let recent = ["#198038", "#ff832b"];
</script>

<Stack gap={5}>
  <ColorPicker bind:value bind:recent {swatches} />
  <p>
    <code>recent</code>: {recent.join(", ")}
  </p>
</Stack>
