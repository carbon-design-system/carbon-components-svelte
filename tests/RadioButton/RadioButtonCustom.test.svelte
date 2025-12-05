<script lang="ts">
  import { RadioButton } from "carbon-components-svelte";
</script>

<RadioButton labelText="Custom label" value="custom" name="test-group">
  <span slot="labelChildren">Custom Label Text</span>
</RadioButton>
