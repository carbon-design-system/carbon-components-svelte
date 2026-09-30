<script>
  import {
    Button,
    ChatButton,
    ChatMessage,
    Checkbox,
    ClickableTile,
    ContentSwitcher,
    Header,
    HeaderAction,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
    InlineEdit,
    Menu,
    MenuItem,
    Meter,
    OverflowMenu,
    OverflowMenuItem,
    Popover,
    ProgressBar,
    RadioTile,
    RangeSlider,
    SearchMenu,
    SearchMenuItem,
    SelectableTag,
    SelectableTile,
    ShapeIndicator,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListInput,
    StructuredListRow,
    Switch,
    Tab,
    TableOfContents,
    TableOfContentsItem,
    Tabs,
    Tag,
    Toggle,
    ToggleButton,
    ToggleButtonGroup,
    Toggletip,
    TreeView,
    Truncate,
    UserAvatar,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";

  let menuAnchor = null;
</script>

<Header companyName="E2E" platformName="Forced colors" href="/">
  <HeaderNav>
    <HeaderNavItem href="/" text="Nav item" />
  </HeaderNav>
  <HeaderUtilities>
    <HeaderGlobalAction iconDescription="Search" icon={Search} />
    <HeaderAction isOpen>
      <HeaderPanelLinks>
        <HeaderPanelLink isSelected>Selected link</HeaderPanelLink>
        <HeaderPanelLink>Link</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<main style="padding: 4rem 1rem; max-width: 20rem;">
  <TreeView
    labelText="Tree"
    nodes={[
      { id: "plain", text: "Plain" },
      { id: "selected", text: "Selected" },
      { id: "disabled", text: "Disabled", disabled: true },
    ]}
    selectedIds={["selected"]}
  />

  <ToggleButtonGroup labelText="Toggle buttons" selected={["pressed"]}>
    <ToggleButton value="pressed">Pressed</ToggleButton>
    <ToggleButton value="plain">Plain</ToggleButton>
    <ToggleButton value="disabled" disabled>Disabled</ToggleButton>
  </ToggleButtonGroup>

  <ChatButton quickAction selected>Selected chip</ChatButton>
  <ChatButton quickAction>Chip</ChatButton>
  <ChatButton quickAction disabled>Disabled chip</ChatButton>
  <ChatButton quickAction selected disabled>Chosen chip</ChatButton>

  <SelectableTag selected>Selected tag</SelectableTag>
  <SelectableTag>Tag</SelectableTag>

  <ContentSwitcher selectedIndex={0}>
    <Switch text="Selected switch" />
    <Switch text="Switch" />
  </ContentSwitcher>

  <StructuredList selection selected="selected">
    <StructuredListBody>
      <StructuredListRow label for="structured-selected" value="selected">
        <StructuredListCell>Selected row</StructuredListCell>
        <StructuredListInput id="structured-selected" value="selected" />
      </StructuredListRow>
      <StructuredListRow label for="structured-plain" value="plain">
        <StructuredListCell>Row</StructuredListCell>
        <StructuredListInput id="structured-plain" value="plain" />
      </StructuredListRow>
    </StructuredListBody>
  </StructuredList>

  <Toggle labelText="Toggle" />

  <Truncate reveal="tooltip">
    Failed to deploy revision 214: container image payments-api:2.4.1-rc3
    exceeded the memory limit.
  </Truncate>
  <Truncate reveal="expand" lines={2}>
    Failed to deploy revision 214: container image payments-api:2.4.1-rc3
    exceeded the memory limit configured for the production namespace.
  </Truncate>

  <Tabs selected={1}>
    <Tab label="Tab" />
    <Tab label="Selected tab" />
    <Tab label="Disabled tab" disabled />
  </Tabs>

  <Tag>Tag</Tag>
  <Tag disabled>Disabled tag</Tag>

  <Button kind="ghost" icon={Add} iconDescription="Add" />
  <Button kind="ghost" icon={Add} iconDescription="Add" isSelected />

  <ClickableTile href="/" icon={ArrowRight}>Tile</ClickableTile>
  <ClickableTile icon={ArrowRight} disabled>Disabled tile</ClickableTile>

  <SelectableTile>Selectable tile</SelectableTile>
  <SelectableTile selected>Selected tile</SelectableTile>
  <SelectableTile disabled>Disabled selectable tile</SelectableTile>
  <SelectableTile selected disabled>Disabled selected tile</SelectableTile>
  <RadioTile value="a" disabled>Disabled radio tile</RadioTile>

  <ProgressBar labelText="Progress" value={50} />
  <ProgressBar labelText="Indeterminate" />
  <Meter labelText="Success" value={40} status="success" />
  <Meter
    labelText="Warning"
    value={80}
    thresholds={{ warning: 70 }}
    showThresholds
  />
  <Meter
    labelText="Error"
    value={95}
    thresholds={{ error: 90 }}
    showThresholds
  />

  <div style="position: relative; height: 4rem;">
    <Popover open caret align="bottom">Popover</Popover>
  </div>
  <div style="position: relative; height: 4rem;">
    <Popover open caret border align="bottom">Bordered popover</Popover>
  </div>
  <OverflowMenu open iconDescription="Overflow">
    <OverflowMenuItem text="Item" />
  </OverflowMenu>
  <button bind:this={menuAnchor} type="button">Menu anchor</button>
  <Menu anchor={menuAnchor} open labelText="Menu">
    <MenuItem labelText="Item" />
  </Menu>

  <ShapeIndicator kind="medium" label="Medium" />
  <div theme="g100">
    <ShapeIndicator kind="low" label="Low" />
    <ShapeIndicator kind="cautious" label="Cautious" />
  </div>

  <Checkbox labelText="Checkbox" />
  <Checkbox labelText="Disabled checkbox" disabled />
  <Checkbox labelText="Disabled checked checkbox" disabled checked />

  <TableOfContents selectedId="active" noScrollSpy>
    <TableOfContentsItem href="#plain" text="Plain" />
    <TableOfContentsItem href="#active" text="Active" />
  </TableOfContents>

  <ul style="list-style: none; padding: 0;">
    <ChatMessage from="them">Agent</ChatMessage>
    <ChatMessage from="me">Me</ChatMessage>
    <ChatMessage from="them" typing />
    <ChatMessage from="them" streaming>Streaming agent</ChatMessage>
    <ChatMessage from="me" streaming>Streaming me</ChatMessage>
  </ul>

  <SearchMenu labelText="Search menu">
    <SearchMenuItem text="Result" />
    <SearchMenuItem text="Disabled result" disabled />
    <SearchMenuItem text="Other result" />
  </SearchMenu>

  <InlineEdit
    id="inline-edit"
    labelText="Inline edit"
    editLabel="Edit"
    saveLabel="Save"
    cancelLabel="Cancel"
    value="Editable"
  />
  <InlineEdit
    labelText="Invalid inline edit"
    editLabel="Edit"
    saveLabel="Save"
    cancelLabel="Cancel"
    value="Invalid"
    invalid
    invalidText="Required"
  />
  <InlineEdit
    labelText="Disabled inline edit"
    editLabel="Edit"
    saveLabel="Save"
    cancelLabel="Cancel"
    value="Disabled"
    disabled
  />

  <div style="height: 8rem;">
    <Toggletip labelText="Toggletip">Closed</Toggletip>
    <Toggletip labelText="Open toggletip" open>Open</Toggletip>
  </div>

  <UserAvatar name="Online" status="online" />
  <UserAvatar name="Away" status="away" />
  <UserAvatar name="Busy" status="busy" />
  <UserAvatar name="Offline" status="offline" />

  <RangeSlider
    data-testid="range-slider-drag"
    labelText="Draggable range"
    trackDrag="range"
    value={20}
    valueUpper={60}
  />
</main>
