<script lang="ts">
  import { collapse } from "carbon-components-svelte/motion/collapse.js";

  let open = false;
</script>

<button type="button" on:click={() => (open = !open)}>Toggle</button>
<div data-testid="content" use:collapse={open}>Details</div>
