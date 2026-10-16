<script>
  import {
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
    Switch,
    Toggle,
    ToggleButton,
    ToggleButtonGroup,
    TreeView,
  } from "carbon-components-svelte";
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

  <Toggle labelText="Toggle" />

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
  <OverflowMenu open iconDescription="Overflow">
    <OverflowMenuItem text="Item" />
  </OverflowMenu>
  <button bind:this={menuAnchor} type="button">Menu anchor</button>
  <Menu anchor={menuAnchor} open labelText="Menu">
    <MenuItem labelText="Item" />
  </Menu>
</main>
