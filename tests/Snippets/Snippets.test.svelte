<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import IconIndicator from "carbon-components-svelte/IconIndicator/IconIndicator.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
  import ShapeIndicator from "carbon-components-svelte/ShapeIndicator/ShapeIndicator.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";

  const items = [
    { id: "1", text: "Option 1" },
    { id: "2", text: "Option 2" },
    { id: "3", text: "Option 3" },
  ] as const;

  const dataTableHeaders = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ] as const;

  const treeNodes = [
    {
      id: "parent",
      text: "Parent",
      expanded: true,
      nodes: [{ id: "child", text: "Child" }],
    },
  ];

  const searchResults = [
    { href: "/one", text: "First result" },
    { href: "/two", text: "Second result" },
  ];

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
  {#snippet expandedRow({ row, rowSelected: _rowSelected })}
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

<IconIndicator
  data-testid="icon-indicator-label-children"
  kind="succeeded"
  label="Succeeded"
>
  {#snippet labelChildren()}
    <span data-testid="icon-indicator-custom-label">Custom label content</span>
  {/snippet}
</IconIndicator>

<ShapeIndicator
  data-testid="shape-indicator-label-children"
  kind="stable"
  label="Stable"
>
  {#snippet labelChildren()}
    <span data-testid="shape-indicator-custom-label">Custom label content</span>
  {/snippet}
</ShapeIndicator>

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

<Dropdown data-testid="dropdown-icon-end-snippets" {items} selectedId="1">
  {#snippet iconEnd({ item, selected })}
    <span data-testid="dropdown-icon-end-{item.id}" data-selected={selected}
      >E</span
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
  <OverflowMenuItem text="Edit end">
    {#snippet iconEnd()}
      <span data-testid="overflow-item-icon-end">E</span>
    {/snippet}
  </OverflowMenuItem>
</OverflowMenu>

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
        data-invalid={invalid}>1</span
      >
    {/snippet}
  </ProgressStep>
  <ProgressStep label="Step 2" description="Current">
    {#snippet icon({ complete, current, invalid })}
      <span
        data-testid="progress-step-icon-2"
        data-complete={complete}
        data-current={current}
        data-invalid={invalid}>2</span
      >
    {/snippet}
  </ProgressStep>
  <ProgressStep invalid label="Step 3" description="Invalid">
    {#snippet icon({ complete, current, invalid })}
      <span
        data-testid="progress-step-icon-3"
        data-complete={complete}
        data-current={current}
        data-invalid={invalid}>3</span
      >
    {/snippet}
  </ProgressStep>
</ProgressIndicator>

<Tabs type="container" aria-label="Secondary label tabs">
  <Tab label="Engage" />
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

<TagInput labelText="Topics" value={["alpha", "beta"]}>
  {#snippet tag({ tag, index, props })}
    <Tag {...props} type="teal" data-testid="tag-input-tag-{index}">{tag}</Tag>
  {/snippet}
</TagInput>

<MultiSelect
  data-testid="multiselect-tag-snippet"
  labelText="Options"
  {items}
  selectionDisplay="tags"
  selectedIds={["1", "3"]}
>
  {#snippet tag({ item, index, props })}
    <Tag {...props} type="teal" data-testid="multiselect-tag-{index}">
      {item.text}
    </Tag>
  {/snippet}
</MultiSelect>

<DataTable
  data-testid="datatable-header-footer-snippets"
  headers={dataTableHeaders}
  rows={dataTableRows}
>
  {#snippet cellHeader({ header })}
    <span data-testid="datatable-cell-header-{header.key}"
      >Header: {header.value}</span
    >
  {/snippet}
  {#snippet footerCell({ header, index })}
    <span data-testid="datatable-footer-cell-{index}">Footer: {header.key}</span
    >
  {/snippet}
</DataTable>

<HeaderSearch active results={searchResults} value="result">
  {#snippet children({ result, index, selected })}
    <span data-testid="header-search-result-{index}" data-selected={selected}
      >Result: {result.text}</span
    >
  {/snippet}
</HeaderSearch>

<Tabs aria-label="Tab children tabs">
  <Tab label="Overview">
    {#snippet children({ selected })}
      <span data-testid="tab-children-overview" data-selected={selected}
        >Overview label</span
      >
    {/snippet}
  </Tab>
  <Tab label="Details">
    {#snippet children({ selected })}
      <span data-testid="tab-children-details" data-selected={selected}
        >Details label</span
      >
    {/snippet}
  </Tab>
  <svelte:fragment slot="content">
    <TabContent>Overview content</TabContent>
    <TabContent>Details content</TabContent>
  </svelte:fragment>
</Tabs>

<TreeView labelText="Snippet tree" nodes={treeNodes} expandedIds={["parent"]}>
  {#snippet children({ node })}
    <span data-testid="tree-node-{node.id}" data-expanded={node.expanded}
      >Node: {node.text}</span
    >
  {/snippet}
</TreeView>
