<script lang="ts">
  import ShapeIndicator from "carbon-components-svelte/ShapeIndicator/ShapeIndicator.svelte";
</script>

<ShapeIndicator kind="failed" label="failed" />
<ShapeIndicator kind="critical" label="critical" />
<ShapeIndicator kind="high" label="high" />
<ShapeIndicator kind="medium" label="medium" />
<ShapeIndicator kind="low" label="low" />
<ShapeIndicator kind="cautious" label="cautious" />
<ShapeIndicator kind="undefined" label="undefined" />
<ShapeIndicator kind="stable" label="stable" />
<ShapeIndicator kind="informative" label="informative" />
<ShapeIndicator kind="incomplete" label="incomplete" />
<ShapeIndicator kind="draft" label="draft" />

<ShapeIndicator kind="failed" label="text size 14" textSize={14} />

<ShapeIndicator
  kind="failed"
  label="custom attrs"
  class="custom-class"
  data-testid="attr-test"
/>

<ShapeIndicator
  kind="failed"
  label="Default label"
  data-testid="label-children-test"
>
  <span slot="labelChildren">Custom label content</span>
</ShapeIndicator>
