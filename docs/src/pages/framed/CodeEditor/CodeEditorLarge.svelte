<script>
  import { CodeEditor } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const services = Array.from({ length: 700 }, (_, index) => ({
    id: `svc-${index + 1}`,
    region: ["us-south", "eu-de", "jp-tok"][index % 3],
    replicas: (index % 5) + 1,
    healthy: index % 7 !== 0,
  }));

  let value = JSON.stringify(services, null, 2);
</script>

<CodeEditor
  labelText="Service inventory"
  helperText="{value.split('\n').length.toLocaleString()} lines"
  language="json"
  {tokenize}
  rows={14}
  bind:value
/>
