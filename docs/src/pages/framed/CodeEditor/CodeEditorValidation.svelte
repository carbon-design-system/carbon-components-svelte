<script>
  import { CodeEditor } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  let value = `{
  "region": "us-south",
  "replicas": 3,
  "autoscale": { "min": 2, "max": 8 }
}`;

  $: error = validate(value);

  function validate(text) {
    try {
      JSON.parse(text);
      return "";
    } catch (e) {
      return e.message;
    }
  }
</script>

<CodeEditor
  labelText="Deployment settings"
  helperText="Valid JSON"
  language="json"
  {tokenize}
  invalid={!!error}
  invalidText={error}
  bind:value
/>
