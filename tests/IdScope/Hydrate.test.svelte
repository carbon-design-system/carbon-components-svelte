<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { createIdScope } from "carbon-components-svelte/utils/id-scope.js";

  /** Start a root scope; without one every id is random. */
  export let scoped = true;

  if (scoped) createIdScope("app");

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  const headers = [{ key: "name", value: "Name" }] as const;
  const rows = [
    { id: "r1", name: "Load balancer" },
    { id: "r2", name: "Firewall" },
  ];
</script>

<TextInput labelText="Name" helperText="Your full name" />
<Tabs>
  <Tab label="One" />
  <Tab label="Two" />
  <svelte:fragment slot="content">
    <TabContent>First</TabContent>
    <TabContent>Second</TabContent>
  </svelte:fragment>
</Tabs>
<Accordion>
  <AccordionItem title="One">First</AccordionItem>
  <AccordionItem title="Two">Second</AccordionItem>
</Accordion>
<RadioButtonGroup legendText="Pick" helperText="One only">
  <RadioButton labelText="One" value="1" />
  <RadioButton labelText="Two" value="2" />
</RadioButtonGroup>
<Dropdown labelText="Pick" {items} selectedId="a" />
<DataTable selectable sortable {headers} {rows} />
