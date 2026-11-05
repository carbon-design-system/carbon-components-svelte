<script>
  // One anchored overlay, chosen by `kind`. `portal` is "true", "false" or
  // unset, as each component's `portalPopover`, `portalTooltip` or
  // `portalMenu`.
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";

  /** @type {string} */
  export let kind = "popover";
  /** @type {string} */
  export let direction = "bottom";
  /** @type {string} */
  export let align = "center";
  /** @type {boolean | undefined} */
  export let portal = undefined;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Carrier pigeon" },
    { id: "4", text: "Smoke signal" },
  ];
  const text = "Replicated to two zones, backed up nightly, kept for 30 days.";
  let popoverOpen = true;
</script>

<div id="probe">
  {#if kind === "popover"}
    <span style="position: relative; display: inline-block">
      <Button size="sm" on:click={() => (popoverOpen = !popoverOpen)}
        >Popover</Button
      >
      <Popover open={popoverOpen} caret {align} portalPopover={portal}
        ><div style="padding: 1rem; width: 14rem">{text}</div></Popover
      >
    </span>
  {:else if kind === "tooltip"}
    <Tooltip
      triggerText="Tooltip"
      {direction}
      {align}
      portalTooltip={portal}
      enterDelayMs={0}
      leaveDelayMs={0}
    >
      <p>{text}</p>
    </Tooltip>
  {:else if kind === "tooltipicon"}
    <TooltipIcon
      tooltipText="Icon tooltip text that is fairly long"
      icon={Information}
      {direction}
      {align}
      portalTooltip={portal}
    />
  {:else if kind === "tooltipdef"}
    <TooltipDefinition
      tooltipText="Definition tooltip text that is fairly long"
      {direction}
      {align}
      portalTooltip={portal}
    >
      Definition
    </TooltipDefinition>
  {:else if kind === "button"}
    <Button
      icon={Information}
      iconDescription="Button icon description"
      tooltipPosition={direction}
      tooltipAlignment={align}
      portalTooltip={portal}
    />
  {:else if kind === "toggletip"}
    <Toggletip
      {align}
      {direction}
      iconDescription="Toggletip"
      portalTooltip={portal}
    >
      <p>{text}</p>
    </Toggletip>
  {:else if kind === "dropdown"}
    <div style="width: 16rem">
      <Dropdown
        label="Contact"
        {items}
        portalMenu={portal}
        direction={direction === "top" ? "top" : "bottom"}
      />
    </div>
  {:else if kind === "combobox"}
    <div style="width: 16rem">
      <ComboBox placeholder="Contact" {items} portalMenu={portal} />
    </div>
  {:else if kind === "multiselect"}
    <div style="width: 16rem">
      <MultiSelect label="Contact" {items} portalMenu={portal} />
    </div>
  {:else if kind === "menubutton"}
    <MenuButton labelText="Actions" {direction} intrinsicAlign={align}>
      <MenuItem labelText="Cut" />
      <MenuItem labelText="Copy" />
      <MenuItem labelText="A rather long menu item label" />
    </MenuButton>
  {:else if kind === "overflowmenu"}
    <OverflowMenu iconDescription="Actions" portalMenu={portal} {direction}>
      <OverflowMenuItem text="Action 1" />
      <OverflowMenuItem text="Action 2 which is rather long" />
      <OverflowMenuItem text="Action 3" />
    </OverflowMenu>
  {/if}
</div>
