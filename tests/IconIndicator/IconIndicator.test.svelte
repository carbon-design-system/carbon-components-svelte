<script lang="ts">
  import IconIndicator from "carbon-components-svelte/IconIndicator/IconIndicator.svelte";
</script>

<IconIndicator kind="failed" label="failed" />
<IconIndicator kind="caution-major" label="caution-major" />
<IconIndicator kind="caution-minor" label="caution-minor" />
<IconIndicator kind="undefined" label="undefined" />
<IconIndicator kind="succeeded" label="succeeded" />
<IconIndicator kind="normal" label="normal" />
<IconIndicator kind="in-progress" label="in-progress" />
<IconIndicator kind="incomplete" label="incomplete" />
<IconIndicator kind="not-started" label="not-started" />
<IconIndicator kind="pending" label="pending" />
<IconIndicator kind="unknown" label="unknown" />
<IconIndicator kind="informative" label="informative" />

<IconIndicator kind="failed" label="size 20" size={20} />

<IconIndicator
  kind="failed"
  label="custom attrs"
  class="custom-class"
  data-testid="attr-test"
/>

<IconIndicator
  kind="failed"
  label="Default label"
  data-testid="label-children-test"
>
  <span slot="labelChildren">Custom label content</span>
</IconIndicator>
