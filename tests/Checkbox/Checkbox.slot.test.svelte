<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
</script>

<Checkbox data-testid="checkbox-slot">
  <span slot="labelChildren" data-testid="custom-label">
    Custom label content
  </span>
</Checkbox>
