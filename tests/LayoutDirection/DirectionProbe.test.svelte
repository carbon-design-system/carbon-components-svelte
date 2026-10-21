<script lang="ts">
  import { getLayoutDirection } from "carbon-components-svelte/utils/layout-direction.js";

  export let testId: string;

  const direction = getLayoutDirection();
</script>

<span data-testid={testId}>{$direction ?? "none"}</span>
