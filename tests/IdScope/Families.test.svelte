<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import NumberRangeInput from "carbon-components-svelte/NumberRangeInput/NumberRangeInput.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuGroup from "carbon-components-svelte/SearchMenu/SearchMenuGroup.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import Stepper from "carbon-components-svelte/Stepper/Stepper.svelte";
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListHead from "carbon-components-svelte/StructuredList/StructuredListHead.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";
  import TableOfContents from "carbon-components-svelte/TableOfContents/TableOfContents.svelte";
  import TableOfContentsGroup from "carbon-components-svelte/TableOfContents/TableOfContentsGroup.svelte";
  import TableOfContentsItem from "carbon-components-svelte/TableOfContents/TableOfContentsItem.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import Tearsheet from "carbon-components-svelte/Tearsheet/Tearsheet.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuDetail from "carbon-components-svelte/UIShell/ProfileMenuDetail.svelte";

  /**
   * Which compound component to render. Each one gets an `id` on the root and
   * none on its children, so every other id must derive from it.
   */
  export let family: string;

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  const headers = [
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ] as const;
  const rows = [
    { id: "r1", name: "Load balancer", rule: "Round robin" },
    { id: "r2", name: "Firewall", rule: "DMZ" },
  ];
  const nodes = [
    { id: 1, text: "Parent", nodes: [{ id: 2, text: "Child" }] },
    { id: 3, text: "Sibling" },
  ];
</script>

{#if family === "Tabs"}
  <Tabs id="fixed">
    <Tab label="One" />
    <Tab label="Two" />
    <svelte:fragment slot="content">
      <TabContent>First</TabContent>
      <TabContent>Second</TabContent>
    </svelte:fragment>
  </Tabs>
{:else if family === "TabsVertical"}
  <TabsVertical id="fixed">
    <Tab label="One" />
    <Tab label="Two" />
    <svelte:fragment slot="content">
      <TabContent>First</TabContent>
      <TabContent>Second</TabContent>
    </svelte:fragment>
  </TabsVertical>
{:else if family === "Accordion"}
  <Accordion id="fixed">
    <AccordionItem title="One">First</AccordionItem>
    <AccordionItem title="Two" open>Second</AccordionItem>
  </Accordion>
{:else if family === "ContentSwitcher"}
  <ContentSwitcher id="fixed" labelText="View">
    <Switch text="One" />
    <Switch text="Two" />
  </ContentSwitcher>
{:else if family === "ProgressIndicator"}
  <ProgressIndicator id="fixed">
    <ProgressStep label="One" complete />
    <ProgressStep label="Two" current />
    <ProgressStep label="Three" />
  </ProgressIndicator>
{:else if family === "Stepper"}
  <Stepper id="fixed" steps={["Cart", "Payment", "Review"]} />
{:else if family === "CheckboxGroup"}
  <CheckboxGroup id="fixed" legendText="Pick" helperText="Any" invalid>
    <Checkbox labelText="One" />
    <Checkbox labelText="Two" />
  </CheckboxGroup>
{:else if family === "RadioButtonGroup"}
  <RadioButtonGroup id="fixed" legendText="Pick" helperText="One only">
    <RadioButton labelText="One" value="1" />
    <RadioButton labelText="Two" value="2" />
  </RadioButtonGroup>
{:else if family === "TileGroup"}
  <TileGroup id="fixed" legendText="Pick">
    <RadioTile value="1">One</RadioTile>
    <RadioTile value="2">Two</RadioTile>
  </TileGroup>
{:else if family === "OverflowMenu"}
  <OverflowMenu id="fixed" open>
    <OverflowMenuItem text="One" />
    <OverflowMenuItem text="Two" />
  </OverflowMenu>
{:else if family === "DataTable"}
  <DataTable id="fixed" title="Rules" selectable sortable {headers} {rows}>
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
{:else if family === "DatePicker"}
  <DatePicker id="fixed" datePickerType="range">
    <DatePickerInput labelText="Start" />
    <DatePickerInput labelText="End" />
  </DatePicker>
{:else if family === "TimePicker"}
  <TimePicker id="fixed" labelText="Time">
    <TimePickerSelect>
      <SelectItem value="am" text="AM" />
      <SelectItem value="pm" text="PM" />
    </TimePickerSelect>
  </TimePicker>
{:else if family === "NumberRangeInput"}
  <NumberRangeInput
    id="fixed"
    labelText="Price"
    helperText="In dollars"
    min={0}
    max={100}
    slider
    value={[10, 50]}
  />
{:else if family === "TagSet"}
  <TagSet id="fixed">
    <Tag>One</Tag>
    <Tag>Two</Tag>
  </TagSet>
{:else if family === "TreeView"}
  <TreeView id="fixed" labelText="Tree" {nodes} />
{:else if family === "FileUploader"}
  <FileUploader id="fixed" labelTitle="Upload" buttonLabel="Add file" />
{:else if family === "Dropdown"}
  <Dropdown id="fixed" labelText="Pick" {items} selectedId="a" />
{:else if family === "ComboBox"}
  <ComboBox id="fixed" labelText="Pick" {items} selectedId="a" />
{:else if family === "MultiSelect"}
  <MultiSelect id="fixed" labelText="Pick" {items} selectedIds={["a"]} />
{:else if family === "Select"}
  <Select id="fixed" labelText="Pick">
    <SelectItem value="a" text="Alpha" />
    <SelectItem value="b" text="Beta" />
  </Select>
{:else if family === "StructuredList"}
  <StructuredList id="fixed" selection>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Name</StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      <StructuredListRow>
        <StructuredListCell>One</StructuredListCell>
        <StructuredListInput />
      </StructuredListRow>
      <StructuredListRow>
        <StructuredListCell>Two</StructuredListCell>
        <StructuredListInput />
      </StructuredListRow>
    </StructuredListBody>
  </StructuredList>
{:else if family === "Pagination"}
  <Pagination id="fixed" totalItems={100} pageSizes={[10, 20]} />
{:else if family === "Tearsheet"}
  <Tearsheet id="fixed" open titleText="Create">
    <Dropdown labelText="Source" selectedId="a" {items} />
  </Tearsheet>
{:else if family === "Tooltip"}
  <Tooltip id="fixed" triggerText="Hint" open>Body</Tooltip>
{:else if family === "SelectableTileGroup"}
  <SelectableTileGroup id="fixed" legendText="Add-ons">
    <SelectableTile value="a">One</SelectableTile>
    <SelectableTile value="b">Two</SelectableTile>
  </SelectableTileGroup>
{:else if family === "ProfileMenu"}
  <ProfileMenu id="fixed" isOpen>
    <ProfileMenuDetail label="Plan">Lite</ProfileMenuDetail>
    <ProfileMenuDetail label="Region">Dallas</ProfileMenuDetail>
  </ProfileMenu>
{:else if family === "HeaderNav"}
  <HeaderNav id="fixed" aria-label="Sections">
    <HeaderNavItem href="/" text="Home" />
    <HeaderNavMenu text="Docs">
      <HeaderNavItem href="/a" text="A" />
    </HeaderNavMenu>
  </HeaderNav>
{:else if family === "TableOfContents"}
  <TableOfContents id="fixed" noScrollSpy>
    <TableOfContentsGroup labelText="Examples">
      <TableOfContentsItem href="#a" text="A" />
    </TableOfContentsGroup>
    <TableOfContentsGroup labelText="Reference">
      <TableOfContentsItem href="#b" text="B" />
    </TableOfContentsGroup>
  </TableOfContents>
{:else if family === "SearchMenu"}
  <SearchMenu id="fixed" labelText="Search" open>
    <SearchMenuGroup label="Recent" filter={false}>
      <SearchMenuItem text="One" value="1" />
      <SearchMenuItem text="Two" value="2" />
    </SearchMenuGroup>
  </SearchMenu>
{:else if family === "ContextMenu"}
  <ContextMenu id="fixed" open>
    <ContextMenuOption labelText="One" />
    <ContextMenuOption labelText="Two" />
  </ContextMenu>
{:else if family === "CommandPalette"}
  <CommandPalette
    id="fixed"
    open
    items={[
      { id: "deploy", text: "Deploy", group: "Actions" },
      { id: "logs", text: "Logs", group: "Go to" },
    ]}
  />
{/if}
