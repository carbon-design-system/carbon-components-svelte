<script lang="ts">
  import Coachmark from "carbon-components-svelte/Coachmark/Coachmark.svelte";
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import Families from "./Families.test.svelte";
  import { FAMILIES } from "./families";

  /** A key of `DERIVED_IDS` in `contract.ts`. */
  export let name: string;

  const headers = [{ key: "name", value: "Name" }] as const;
  const rows = [{ id: "r1", name: "Load balancer" }];
  const files = [
    { title: "a.js", code: "a();" },
    { title: "b.js", code: "b();" },
  ];
</script>

{#if FAMILIES.includes(name)}
  <Families family={name} />
{:else if name === "DataTableBatchExpandable"}
  <DataTable
    id="fixed"
    title="Rules"
    description="Active rules"
    batchSelection
    expandable
    {headers}
    {rows}
  >
    <svelte:fragment slot="expandedRow">Details</svelte:fragment>
  </DataTable>
{:else if name === "CodeSnippet"}
  <CodeSnippet id="fixed" type="multi" title="Install" code="npm i" />
{:else if name === "CodeSnippetFiles"}
  <CodeSnippet id="fixed" type="multi" {files} />
{:else if name === "ExpandableTile"}
  <ExpandableTile id="fixed">
    <div slot="above">Above</div>
    <div slot="below">Below</div>
  </ExpandableTile>
{:else if name === "HeaderAction"}
  <Header companyName="Test" platformName="Test">
    <HeaderUtilities>
      <HeaderAction id="fixed" isOpen transition={false} iconDescription="Apps">
        Panel
      </HeaderAction>
    </HeaderUtilities>
  </Header>
{:else if name === "PinCodeInput"}
  <PinCodeInput id="fixed" labelText="Code" />
{:else if name === "Coachmark"}
  <Coachmark id="fixed" open titleText="Export in bulk">Body</Coachmark>
{/if}
