<script>
  import {
    Accordion,
    AccordionItem,
    Dropdown,
    setIconContext,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import CaretDown from "carbon-icons-svelte/lib/CaretDown.svelte";
  import CaretRight from "carbon-icons-svelte/lib/CaretRight.svelte";
  import WarningHexFilled from "carbon-icons-svelte/lib/WarningHexFilled.svelte";

  setIconContext({
    ChevronDown: CaretDown,
    ChevronRight: CaretRight,
    WarningFilled: WarningHexFilled,
  });
</script>

<Stack gap={6}>
  <Accordion>
    <AccordionItem title="Billing" open>
      Invoices go to the account owner on the first of each month.
    </AccordionItem>
    <AccordionItem title="Usage">Usage resets at midnight UTC.</AccordionItem>
  </Accordion>
  <Dropdown
    labelText="Region"
    selectedId="us-south"
    items={[
      { id: "us-south", text: "Dallas (us-south)" },
      { id: "eu-de", text: "Frankfurt (eu-de)" },
    ]}
  />
  <TextInput
    labelText="Port"
    value="70000"
    invalid
    invalidText="Enter a port from 1 to 65535."
  />
</Stack>
