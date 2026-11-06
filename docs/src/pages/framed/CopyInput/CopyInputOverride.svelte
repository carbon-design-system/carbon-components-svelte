<script>
  import { CopyInput } from "carbon-components-svelte";
</script>

<CopyInput
  labelText="API endpoint"
  value="https://api.acme.io/v1"
  copy={(text) => navigator.clipboard.writeText(text)}
/>
