<script>
  import {
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
    Menu,
    MenuItem,
    Meter,
    OverflowMenu,
    OverflowMenuItem,
    Popover,
    ProgressBar,
    SelectableTag,
    SelectableTile,
    ShapeIndicator,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListInput,
    StructuredListRow,
    Switch,
    Toggle,
    ToggleButton,
    ToggleButtonGroup,
    TreeView,
    Truncate,
  } from "carbon-components-svelte";
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

  <ClickableTile href="/" icon={ArrowRight}>Tile</ClickableTile>
  <ClickableTile icon={ArrowRight} disabled>Disabled tile</ClickableTile>

  <SelectableTile>Selectable tile</SelectableTile>
  <SelectableTile selected>Selected tile</SelectableTile>
  <SelectableTile disabled>Disabled selectable tile</SelectableTile>
  <SelectableTile selected disabled>Disabled selected tile</SelectableTile>

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
</main>
