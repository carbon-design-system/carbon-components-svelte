<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import type { ComponentProps } from "svelte";

  export let flush: ComponentProps<Accordion>["flush"] = false;
  export let count = 4;
  export let open = true;
</script>

<Accordion skeleton {flush} {count} {open} />
