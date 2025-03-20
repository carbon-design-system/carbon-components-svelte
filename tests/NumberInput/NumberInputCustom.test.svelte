<script lang="ts">
  import { NumberInput } from "carbon-components-svelte";
</script>

<NumberInput label="Custom label" value={0}>
  <span slot="label">Custom Label Text</span>
</NumberInput>
