<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { setIconContext } from "carbon-components-svelte/utils/icon-context.js";
  import SwappedIcon from "./SwappedIcon.test.svelte";

  setIconContext({ WarningFilled: SwappedIcon });
</script>

<div data-testid="nested">
  <Accordion>
    <AccordionItem title="Usage" />
  </Accordion>
  <TextInput labelText="Host" invalid invalidText="Enter a host." />
</div>
