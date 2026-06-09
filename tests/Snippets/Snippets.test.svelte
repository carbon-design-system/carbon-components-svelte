<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";

  const items = [
    { id: "1", text: "Option 1" },
    { id: "2", text: "Option 2" },
    { id: "3", text: "Option 3" },
  ] as const;

  const dataTableHeaders = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ] as const;

  const dataTableRows = [
    { id: "a", name: "Load Balancer 1", protocol: "HTTP" },
    { id: "b", name: "Load Balancer 2", protocol: "HTTPS" },
  ];
</script>

<DataTable
  data-testid="datatable-expand-icon-snippet-container"
  expandable
  headers={dataTableHeaders}
  rows={dataTableRows}
>
  {#snippet expandIcon({ expanded, row, props })}
    <span
      data-testid="datatable-expand-icon-snippet"
      {...props}
      data-expanded={expanded}
    ></span>
  {/snippet}
  {#snippet expandedRow({ row, rowSelected })}
    <pre>{JSON.stringify(row, null, 2)}</pre>
  {/snippet}
</DataTable>

<Dropdown data-testid="dropdown-snippet" {items} selectedId="1">
  {#snippet children({ item, index, selected, highlighted })}
    <span
      data-testid="dropdown-item-{index}"
      data-selected={selected}
      data-highlighted={highlighted}
      >{item.text}
      (#{index})</span
    >
  {/snippet}
</Dropdown>

<Dropdown data-testid="dropdown-label-children" {items} selectedId="1">
  {#snippet labelChildren()}
    <span data-testid="dropdown-custom-label">Custom label content</span>
  {/snippet}
</Dropdown>

<Dropdown data-testid="dropdown-icon-snippets" {items} selectedId="1">
  {#snippet icon({ item })}
    <span data-testid="dropdown-icon-{item.id}">L</span>
  {/snippet}
  {#snippet iconRight({ item, selected })}
    <span data-testid="dropdown-icon-right-{item.id}" data-selected={selected}
      >R</span
    >
  {/snippet}
</Dropdown>

<ComboBox data-testid="combobox-snippet" {items} selectedId="2">
  {#snippet children({ item, index, selected })}
    <span data-testid="combobox-item-{index}" data-selected={selected}
      >{item.text}
      - index {index}</span
    >
  {/snippet}
</ComboBox>

<OverflowMenu data-testid="overflow-menu-snippet" open>
  <OverflowMenuItem text="Edit">
    {#snippet icon()}
      <span data-testid="overflow-item-icon-left">L</span>
    {/snippet}
    {#snippet iconRight()}
      <span data-testid="overflow-item-icon-right">R</span>
    {/snippet}
  </OverflowMenuItem>
</OverflowMenu>

<Button data-testid="button-snippet" as let:props>
  <div {...props} data-testid="custom-button">Custom Button Element</div>
</Button>

<div data-testid="theme-snippet">
  <Theme>
    {#snippet children({ theme })}
      <div data-testid="theme-value">Current theme: {theme}</div>
    {/snippet}
  </Theme>
</div>

<ProgressIndicator data-testid="progress-step-icon-snippet" currentIndex={1}>
  <ProgressStep complete label="Step 1" description="Completed">
    {#snippet icon({ complete, current, invalid })}
      <span
        data-testid="progress-step-icon-1"
        data-complete={complete}
        data-current={current}
        data-invalid={invalid}
        >1</span
      >
    {/snippet}
  </ProgressStep>
  <ProgressStep label="Step 2" description="Current">
    {#snippet icon({ complete, current, invalid })}
      <span
        data-testid="progress-step-icon-2"
        data-complete={complete}
        data-current={current}
        data-invalid={invalid}
        >2</span
      >
    {/snippet}
  </ProgressStep>
  <ProgressStep invalid label="Step 3" description="Invalid">
    {#snippet icon({ complete, current, invalid })}
      <span
        data-testid="progress-step-icon-3"
        data-complete={complete}
        data-current={current}
        data-invalid={invalid}
        >3</span
      >
    {/snippet}
  </ProgressStep>
</ProgressIndicator>

<Tabs
  type="container"
  data-testid="tabs-secondary-label-snippet"
  aria-label="Secondary label tabs"
>
  <Tab label="Engage" secondaryLabel="(21/25)" />
  <Tab label="Analyze">
    {#snippet secondaryChildren()}
      <span data-testid="tab-secondary-label-snippet">(12/16)</span>
    {/snippet}
  </Tab>
  <svelte:fragment slot="content">
    <TabContent>Engage content</TabContent>
    <TabContent>Analyze content</TabContent>
  </svelte:fragment>
</Tabs>
