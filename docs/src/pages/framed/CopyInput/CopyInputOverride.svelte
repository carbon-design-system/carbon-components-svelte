<script>
  import { CopyInput } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CopyInput
  labelText="API endpoint"
  value="https://api.example.com/v1"
  copy={(text) => copy(text)}
/>
