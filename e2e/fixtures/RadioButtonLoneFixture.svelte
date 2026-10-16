<script>
  import { RadioButton } from "carbon-components-svelte";
</script>

<!-- Radio buttons outside a RadioButtonGroup, in a wider box. -->
<div style="width: 400px; display: grid; gap: 1rem;">
  <div data-testid="lone">
    <RadioButton labelText="Daily" value="daily" />
  </div>
  <div data-testid="lone-label-left">
    <RadioButton labelText="Weekly" value="weekly" labelPosition="left" />
  </div>
</div>
