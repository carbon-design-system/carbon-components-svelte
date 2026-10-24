<script>
  import {
    ContentSwitcher,
    ContextMenu,
    ContextMenuOption,
    MenuButton,
    MenuItem,
    OverflowMenu,
    OverflowMenuItem,
    ProgressIndicator,
    ProgressStep,
    Switch,
    Tag,
    TagSet,
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";

  let target;
</script>

<!-- Pinned to physical edges, so a direction change doesn't move them. -->
<div data-testid="menu-button-right" class="edge right top">
  <MenuButton labelText="Actions">
    <MenuItem labelText="Copy" />
    <MenuItem labelText="Export as">
      <MenuItem labelText="PDF" />
      <MenuItem labelText="PNG" />
    </MenuItem>
  </MenuButton>
</div>
<div data-testid="menu-button-left" class="edge left top">
  <MenuButton labelText="Tools" intrinsicAlign="end">
    <MenuItem labelText="Cut" />
    <MenuItem labelText="Share via">
      <MenuItem labelText="Email" />
      <MenuItem labelText="Link" />
    </MenuItem>
  </MenuButton>
</div>

<div data-testid="overflow-right" class="edge right middle">
  <OverflowMenu iconDescription="Row actions">
    <OverflowMenuItem text="Restart" />
    <OverflowMenuItem text="Stop" />
  </OverflowMenu>
</div>
<div data-testid="overflow-left" class="edge left middle">
  <OverflowMenu flipped iconDescription="Table actions">
    <OverflowMenuItem text="Export" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>
<div data-testid="overflow-portal-right" class="edge right lower">
  <OverflowMenu portalMenu iconDescription="Service actions">
    <OverflowMenuItem text="Deploy" />
    <OverflowMenuItem text="Scale" />
  </OverflowMenu>
</div>
<div data-testid="overflow-portal-left" class="edge left lower">
  <OverflowMenu portalMenu flipped iconDescription="Region actions">
    <OverflowMenuItem text="Enable" />
    <OverflowMenuItem text="Disable" />
  </OverflowMenu>
</div>

<div data-testid="context-target" class="context-target" bind:this={target}>
  Right-click here
</div>
<ContextMenu target={[target]} labelText="Page actions">
  <ContextMenuOption labelText="Rename" />
  <ContextMenuOption labelText="Move to">
    <ContextMenuOption labelText="Archive" />
    <ContextMenuOption labelText="Trash" />
  </ContextMenuOption>
</ContextMenu>

<div class="roving">
  <ContentSwitcher data-testid="content-switcher">
    <Switch text="Latest" />
    <Switch text="Trending" />
    <Switch text="Saved" />
  </ContentSwitcher>
  <ToggleButtonGroup data-testid="toggle-group" labelText="Text style">
    <ToggleButton value="bold">Bold</ToggleButton>
    <ToggleButton value="italic">Italic</ToggleButton>
    <ToggleButton value="underline">Underline</ToggleButton>
  </ToggleButtonGroup>
  <ProgressIndicator data-testid="progress" currentIndex={2}>
    <ProgressStep complete label="Plan" />
    <ProgressStep complete label="Build" />
    <ProgressStep label="Ship" />
  </ProgressIndicator>
  <TagSet data-testid="tag-set" navigation="roving">
    <Tag filter>Alpha</Tag>
    <Tag filter>Beta</Tag>
    <Tag filter>Gamma</Tag>
  </TagSet>
</div>

<style>
  .edge {
    position: absolute;
  }

  .left {
    left: 8px;
  }

  .right {
    right: 8px;
  }

  .top {
    top: 8px;
  }

  .middle {
    top: 120px;
  }

  .lower {
    top: 240px;
  }

  .context-target {
    position: absolute;
    top: 360px;
    right: 8px;
    left: 8px;
    height: 120px;
    border: 1px dashed;
  }

  .roving {
    position: absolute;
    top: 520px;
    left: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 600px;
  }
</style>
