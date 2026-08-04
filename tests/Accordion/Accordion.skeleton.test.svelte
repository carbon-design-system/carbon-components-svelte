<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import type { ComponentProps } from "svelte";

  export let flush: ComponentProps<Accordion>["flush"] = false;
</script>

<Accordion skeleton {flush} />
