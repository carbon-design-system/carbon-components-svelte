<script lang="ts">
  import { NumberInput } from "carbon-components-svelte";
</script>

<NumberInput labelText="Custom label" value={0}>
  <span slot="labelText">Custom Label Text</span>
</NumberInput>
