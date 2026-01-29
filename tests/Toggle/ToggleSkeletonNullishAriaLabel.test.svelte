<script lang="ts">
  import { ToggleSkeleton } from "carbon-components-svelte";

  export let ariaLabel: string = "";
</script>

<ToggleSkeleton labelText="" aria-label={ariaLabel} />
