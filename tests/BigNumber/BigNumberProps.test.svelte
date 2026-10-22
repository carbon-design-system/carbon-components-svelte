<script lang="ts">
  import BigNumber from "carbon-components-svelte/BigNumber/BigNumber.svelte";
  import type { ComponentProps } from "svelte";

  export let options: Partial<ComponentProps<BigNumber>> = {};
</script>

<!-- `locale` is pinned so number formatting does not depend on the runtime. -->
<BigNumber
  labelText="Metric"
  locale="en-US"
  {...options}
  data-testid="metric"
/>
