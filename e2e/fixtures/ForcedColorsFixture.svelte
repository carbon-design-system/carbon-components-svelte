<script>
  import "carbon-components-svelte/css/prose.css";
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    ChatButton,
    ChatDivider,
    ChatMessage,
    Checkbox,
    ClickableTile,
    ComboBox,
    ContentSwitcher,
    CopyInput,
    DatePicker,
    DatePickerInput,
    Disclosure,
    Dropdown,
    ExpandableTile,
    Header,
    HeaderAction,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderSearch,
    HeaderUtilities,
    InlineEdit,
    Kbd,
    Menu,
    MenuItem,
    Meter,
    MultiSelect,
    NotificationActionButton,
    NumberInput,
    OverflowMenu,
    OverflowMenuItem,
    PaginationNav,
    PasswordInput,
    PinCodeInput,
    Popover,
    ProgressBar,
    ProgressIndicator,
    ProgressStep,
    Prose,
    RadioTile,
    RangeSlider,
    Search as SearchField,
    SearchMenu,
    SearchMenuItem,
    Select,
    SelectableTag,
    SelectableTile,
    SelectItem,
    ShapeIndicator,
    SidePanel,
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
    TabsVertical,
    Tag,
    TagInput,
    TagSet,
    TextArea,
    TextInput,
    TimePicker,
    ToastNotification,
    Toggle,
    ToggleButton,
    ToggleButtonGroup,
    Toggletip,
    TreeSelect,
    TreeView,
    Truncate,
    UserAvatar,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";

  let menuAnchor = null;
  let sidePanelOpen = false;

  const regionTree = [
    {
      id: "americas",
      text: "Americas",
      nodes: [
        { id: "us", text: "United States" },
        { id: "ca", text: "Canada" },
      ],
    },
    { id: "emea", text: "EMEA" },
  ];

  const regions = [
    { id: "us-east", text: "US East" },
    { id: "us-west", text: "US West" },
    { id: "eu-central", text: "EU Central" },
  ];
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

  <Card clickable href="/" aria-label="Card" data-testid="card">
    <CardBody>Card</CardBody>
  </Card>
  <Card
    clickable
    disabled
    aria-label="Disabled card"
    data-testid="card-disabled"
  >
    <CardHeader>
      <CardTitle>
        <svelte:fragment slot="label">Label</svelte:fragment>
        Disabled card
      </CardTitle>
    </CardHeader>
  </Card>
  <Card data-testid="card-static"><CardBody>Static card</CardBody></Card>

  <Button data-testid="side-panel-open" on:click={() => (sidePanelOpen = true)}>
    Open side panel
  </Button>
  <SidePanel bind:open={sidePanelOpen} resizable title="Side panel">
    Side panel
  </SidePanel>

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
    <MenuItem labelText="Disabled item" shortcutText="⌘S" disabled />
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

  <TagSet overflowMode="popover" maxVisible={1} viewAllThreshold={0}>
    <Tag>us-south</Tag>
    <Tag>eu-de</Tag>
  </TagSet>

  <Prose data-testid="prose">
    <pre><code>npm i carbon-components-svelte</code></pre>
    <blockquote><p>Regions can't be changed later.</p></blockquote>
    <table>
      <thead>
        <tr>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Success</td>
        </tr>
      </tbody>
    </table>
    <hr />
  </Prose>

  <RangeSlider
    data-testid="range-slider-drag"
    labelText="Draggable range"
    trackDrag="range"
    value={20}
    valueUpper={60}
  />

  <ToastNotification title="Upload failed" subtitle="The connection timed out.">
    <svelte:fragment slot="actions">
      <NotificationActionButton>Retry</NotificationActionButton>
    </svelte:fragment>
  </ToastNotification>

  <PaginationNav total={5} page={2} />

  <div data-testid="fields">
    <div data-testid="text"><TextInput labelText="Text input" /></div>
    <div data-testid="password">
      <PasswordInput labelText="Password input" />
    </div>
    <div data-testid="number">
      <NumberInput labelText="Number input" value={1} />
    </div>
    <div data-testid="textarea"><TextArea labelText="Text area" /></div>
    <div data-testid="search"><SearchField labelText="Search field" /></div>
    <div data-testid="select">
      <Select labelText="Select">
        <SelectItem value="us-east" text="US East" />
      </Select>
    </div>
    <div data-testid="combobox">
      <ComboBox labelText="Combo box" items={regions} />
    </div>
    <div data-testid="dropdown">
      <Dropdown labelText="Dropdown" items={regions} selectedId="us-east" />
    </div>
    <div data-testid="multiselect">
      <MultiSelect labelText="Multi select" items={regions} />
    </div>
    <div data-testid="treeselect">
      <TreeSelect
        labelText="Tree select"
        nodes={regionTree}
        selectionMode="checkbox"
        expandedIds={["americas"]}
        checkedIds={["us"]}
      />
    </div>
    <div data-testid="multiselect-filterable">
      <MultiSelect
        labelText="Filterable multi select"
        filterable
        items={regions}
      />
    </div>
    <div data-testid="date">
      <DatePicker datePickerType="single">
        <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
      </DatePicker>
    </div>
    <div data-testid="time"><TimePicker labelText="Time" /></div>
    <div data-testid="tags"><TagInput labelText="Tags" /></div>
    <div data-testid="copy">
      <CopyInput labelText="Copy input" value="sk-live-4f2a" />
    </div>
    <div data-testid="pin"><PinCodeInput labelText="Pin code" /></div>
  </div>

  <div data-testid="fluid-fields">
    <div data-testid="text">
      <TextInput fluid labelText="Fluid text input" />
    </div>
    <div data-testid="password">
      <PasswordInput fluid labelText="Fluid password input" />
    </div>
    <div data-testid="number">
      <NumberInput fluid labelText="Fluid number input" value={1} />
    </div>
    <div data-testid="textarea">
      <TextArea fluid labelText="Fluid text area" />
    </div>
    <div data-testid="search">
      <SearchField fluid labelText="Fluid search field" />
    </div>
    <div data-testid="select">
      <Select fluid labelText="Fluid select">
        <SelectItem value="us-east" text="US East" />
      </Select>
    </div>
    <div data-testid="combobox">
      <ComboBox fluid labelText="Fluid combo box" items={regions} />
    </div>
    <div data-testid="dropdown">
      <Dropdown
        fluid
        labelText="Fluid dropdown"
        items={regions}
        selectedId="us-east"
      />
    </div>
    <div data-testid="multiselect">
      <MultiSelect fluid labelText="Fluid multi select" items={regions} />
    </div>
    <div data-testid="date">
      <DatePicker fluid datePickerType="single">
        <DatePickerInput labelText="Fluid date" placeholder="mm/dd/yyyy" />
      </DatePicker>
    </div>
    <div data-testid="time"><TimePicker fluid labelText="Fluid time" /></div>
    <div data-testid="copy">
      <CopyInput fluid labelText="Fluid copy input" value="sk-live-4f2a" />
    </div>
    <div data-testid="pin">
      <PinCodeInput fluid labelText="Fluid pin code" />
    </div>
  </div>

  <div data-testid="icons">
    <ContentSwitcher size="sm">
      <Switch text="Grid view" icon={Grid} />
      <Switch text="List view" icon={List} />
    </ContentSwitcher>
    <Disclosure summary="Deployment details">Region: US East</Disclosure>
    <ProgressIndicator currentIndex={1}>
      <ProgressStep complete label="Build" />
      <ProgressStep label="Deploy" />
      <ProgressStep label="Verify" />
    </ProgressIndicator>
    <Tabs dismissible>
      <Tab label="Overview" />
      <Tab label="Logs" />
    </Tabs>
    <ExpandableTile>
      <div slot="above">Deployment</div>
      <div slot="below">Region: US East</div>
    </ExpandableTile>
    <RadioTile value="us-east" checked>US East</RadioTile>
    <ToggleButtonGroup labelText="View" selected={[]}>
      <ToggleButton value="grid" icon={Grid} iconDescription="Grid" />
    </ToggleButtonGroup>
    <TreeView
      labelText="Services"
      nodes={[
        {
          id: "api",
          text: "API",
          icon: Folder,
          nodes: [{ id: "payments", text: "payments" }],
        },
      ]}
    />
    <Select readonly labelText="Read-only select">
      <SelectItem value="us-east" text="US East" />
    </Select>
    <DatePicker datePickerType="single">
      <DatePickerInput readonly labelText="Read-only date" />
    </DatePicker>
    <Dropdown readonly labelText="Read-only dropdown" items={regions} />
    <NumberInput disabled labelText="Disabled number input" value={1} />
  </div>

  <div style="height: 8rem;">
    <HeaderSearch
      value="api"
      results={[
        { href: "/", text: "payments-api" },
        { href: "/", text: "orders-api" },
      ]}
    />
  </div>

  <ul style="list-style: none; padding: 0;">
    <ChatDivider>Today</ChatDivider>
  </ul>

  <div data-testid="tabs-vertical">
    <TabsVertical orientation="vertical" selected={1}>
      <Tab label="Vertical tab" />
      <Tab label="Selected vertical tab" />
      <Tab label="Disabled vertical tab" disabled />
    </TabsVertical>
  </div>

  <div data-testid="tabs-container">
    <Tabs type="container" selected={1}>
      <Tab label="Overview" />
      <Tab label="Logs" />
      <Tab label="Metrics" />
      <Tab label="Alerts" />
      <Tab label="Settings" disabled />
    </Tabs>
  </div>

  <div>
    <Kbd id="fc-kbd" shortcut="ctrl+k" apple={false} />
    <Button id="fc-kbd-button" shortcut="ctrl+alt+s">Save</Button>
    <Button id="fc-kbd-button-disabled" shortcut="ctrl+alt+d" disabled>
      Delete
    </Button>
  </div>

  <ul data-testid="overflow-menus" style="list-style: none; padding: 0;">
    {#each [1, 2, 3] as row}
      <li>
        <OverflowMenu
          id="fc-overflow-{row}"
          iconDescription="Row {row} actions"
        >
          <OverflowMenuItem text="Edit" />
        </OverflowMenu>
      </li>
    {/each}
  </ul>
</main>
