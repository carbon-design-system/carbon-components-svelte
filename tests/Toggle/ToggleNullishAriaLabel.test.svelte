<script lang="ts">
  import { Toggle } from "carbon-components-svelte";

  export let ariaLabel: string = "";
</script>

<Toggle hideLabel labelText="" aria-label={ariaLabel} />
