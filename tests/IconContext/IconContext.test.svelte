<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { setIconContext } from "carbon-components-svelte/utils/icon-context.js";
  import IconContextNested from "./IconContextNested.test.svelte";
  import SwappedIcon from "./SwappedIcon.test.svelte";

  export let swap = true;

  if (swap) setIconContext({ ChevronRight: SwappedIcon, Search: SwappedIcon });
</script>

<Accordion data-testid="outer">
  <AccordionItem title="Billing" />
</Accordion>
<Search labelText="Filter" />
<TextInput labelText="Port" invalid invalidText="Enter a port." />
<IconContextNested />
