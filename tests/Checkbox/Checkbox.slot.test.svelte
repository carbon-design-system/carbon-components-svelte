<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";
</script>

<Checkbox data-testid="checkbox-slot">
  <span slot="labelText" data-testid="custom-label">Custom label content</span>
</Checkbox>
