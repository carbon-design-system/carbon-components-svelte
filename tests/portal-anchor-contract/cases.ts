import { fireEvent, screen } from "@testing-library/svelte";
import Button from "carbon-components-svelte/Button/Button.svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import Popover from "carbon-components-svelte/Popover/Popover.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import { tick } from "svelte";
import Add from "../../src/icons/Add.svelte";
import type { Exemptions, PortalCase } from "./contract";
import MenuHost from "./fixtures/MenuHost.test.svelte";
import SearchMenuHost from "./fixtures/SearchMenuHost.test.svelte";
import SwitchIcon from "./fixtures/SwitchIcon.test.svelte";
import TabsIconOnly from "./fixtures/TabsIconOnly.test.svelte";
import TagHost from "./fixtures/TagHost.test.svelte";
import TruncateHost from "./fixtures/TruncateHost.test.svelte";

const TRUNCATED_TEXT = /Failed to deploy/;

const items = [
  { id: "0", text: "Ada" },
  { id: "1", text: "Grace" },
];

/** Focuses the element an icon tooltip hangs from, which opens it. */
const focus = (element: () => HTMLElement) => async () => {
  element().focus();
  await tick();
};

const listBox = { items, open: true, portalMenu: true, titleText: "Field" };

export const cases: PortalCase[] = [
  { name: "Dropdown", variant: "default", component: Dropdown, props: listBox },
  { name: "ComboBox", variant: "default", component: ComboBox, props: listBox },
  {
    name: "MultiSelect",
    variant: "default",
    component: MultiSelect,
    props: listBox,
  },
  {
    name: "MultiSelect",
    variant: "filterable",
    component: MultiSelect,
    props: { ...listBox, filterable: true },
  },
  {
    name: "OverflowMenu",
    variant: "default",
    component: OverflowMenu,
    props: { open: true, portalMenu: true },
  },
  {
    name: "Tooltip",
    variant: "icon",
    component: Tooltip,
    props: { open: true, portalTooltip: true, triggerText: "Field" },
  },
  {
    name: "Tooltip",
    variant: "hideIcon",
    component: Tooltip,
    props: {
      open: true,
      portalTooltip: true,
      triggerText: "Field",
      hideIcon: true,
    },
  },
  {
    name: "TooltipDefinition",
    variant: "default",
    component: TooltipDefinition,
    props: { open: true, portalTooltip: true, tooltipText: "Definition" },
  },
  {
    name: "Popover",
    variant: "default",
    component: Popover,
    props: { open: true, portalPopover: true },
  },
  {
    name: "SearchMenu",
    variant: "default",
    component: SearchMenuHost,
    open: focus(() => screen.getByRole("combobox")),
  },
  {
    name: "SearchMenu",
    variant: "before slot",
    component: SearchMenuHost,
    props: { before: true },
    open: focus(() => screen.getByRole("combobox")),
  },
  {
    name: "MenuButton",
    variant: "labelled",
    component: MenuHost,
  },
  {
    name: "MenuButton",
    variant: "iconOnly",
    component: MenuHost,
    props: { trigger: "icon-only" },
  },
  {
    name: "ComboButton",
    variant: "default",
    component: MenuHost,
    props: { trigger: "combo-button" },
  },
  {
    name: "MenuItem",
    variant: "submenu",
    component: MenuHost,
    // The MenuButton's menu, then the submenu.
    portals: 2,
    open: async () => {
      const item = screen.getByRole("menuitem", { name: "Export as" });
      item.focus();
      item.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      await tick();
    },
  },
  {
    name: "Button",
    variant: "icon-only",
    component: Button,
    props: { icon: Add, iconDescription: "Add", portalTooltip: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "Button",
    variant: "icon-only link",
    component: Button,
    props: {
      icon: Add,
      iconDescription: "Add",
      portalTooltip: true,
      href: "#add",
    },
    open: focus(() => screen.getByRole("link")),
  },
  {
    name: "CopyButton",
    variant: "default",
    component: CopyButton,
    props: { text: "Copied", portalTooltip: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "TooltipIcon",
    variant: "default",
    component: TooltipIcon,
    props: { tooltipText: "Info", portalTooltip: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "ToggleButton",
    variant: "icon-only",
    component: ToggleButton,
    props: { icon: Add, iconDescription: "Bold" },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "PasswordInput",
    variant: "visibility toggle",
    component: PasswordInput,
    props: { labelText: "Password", portalTooltip: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "CodeSnippet",
    variant: "inline",
    component: CodeSnippet,
    props: { type: "inline", code: "npm i", portalTooltip: true },
    // The inline snippet's tooltip is the copy feedback.
    open: async () => {
      await fireEvent.click(screen.getByRole("button"));
    },
  },
  {
    name: "Tab",
    variant: "icon-only",
    component: TabsIconOnly,
    open: focus(() => screen.getByRole("tab")),
  },
  {
    name: "Switch",
    variant: "icon",
    component: SwitchIcon,
    open: focus(() => screen.getByRole("tab")),
  },
  {
    name: "Tag",
    variant: "filter close button",
    component: TagHost,
    props: { filter: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "Tag",
    variant: "truncated link",
    component: TagHost,
    props: { href: "#tag" },
    open: focus(() => screen.getByRole("link")),
  },
  {
    name: "Tag",
    variant: "truncated interactive",
    component: TagHost,
    props: { interactive: true },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "SelectableTag",
    variant: "truncated",
    component: TagHost,
    props: { kind: "selectable" },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "OperationalTag",
    variant: "truncated",
    component: TagHost,
    props: { kind: "operational" },
    open: focus(() => screen.getByRole("button")),
  },
  {
    name: "Truncate",
    variant: "tooltip reveal",
    component: TruncateHost,
    open: focus(() => screen.getByText(TRUNCATED_TEXT)),
  },
];

const CALLER_ANCHOR =
  "a building block that takes `anchor` from its caller, which has its own case";

export const exempt: Exemptions = {
  AnchoredTooltip: CALLER_ANCHOR,
  ListBoxMenu: CALLER_ANCHOR,
  Menu: CALLER_ANCHOR,
  PortalTooltip: CALLER_ANCHOR,
};
