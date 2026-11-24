<script>
  import {
    Button,
    CodeSnippet,
    CopyButton,
    Dialog,
    OverflowMenu,
    OverflowMenuItem,
    Tab,
    Tabs,
    Toggletip,
    Tooltip,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>Open dialog</button>

<Dialog bind:open modal aria-label="Workspace">
  <Tabs iconOnly>
    <Tab label="Dashboard" icon={Dashboard} />
    <Tab label="Settings" icon={Settings} />
  </Tabs>
  <Button
    kind="ghost"
    icon={Add}
    iconDescription="Add item"
    portalTooltip={false}
  />
  <Button kind="ghost" icon={Edit} iconDescription="Edit item" portalTooltip />
  <Tooltip triggerText="Details">
    <p>Tooltip details</p>
  </Tooltip>
  <button type="button">Plain button</button>
  <TooltipIcon tooltipText="Icon help" icon={Information} />
  <TooltipDefinition tooltipText="Definition help">Term</TooltipDefinition>
  <CopyButton text="copied" iconDescription="Copy link" copy={() => {}} />
  <CodeSnippet type="inline" code="npm i" copy={() => {}} />
  <Toggletip iconDescription="Show information">Toggletip help</Toggletip>
  <OverflowMenu iconDescription="Actions">
    <OverflowMenuItem text="Rename" />
  </OverflowMenu>
</Dialog>
