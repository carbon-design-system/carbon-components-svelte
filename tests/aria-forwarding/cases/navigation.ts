import { render, screen } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
import Tag from "carbon-components-svelte/Tag/Tag.svelte";
import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";
import type { AriaEntry } from "../contract";
import ContentSwitcherFixture from "../fixtures/ContentSwitcher.test.svelte";
import HeaderNavFixture from "../fixtures/HeaderNav.test.svelte";
import ProfileMenuItemFixture from "../fixtures/ProfileMenuItem.test.svelte";
import ProgressStepFixture from "../fixtures/ProgressStep.test.svelte";
import TableFixture from "../fixtures/Table.test.svelte";
import TableHeaderFixture from "../fixtures/TableHeader.test.svelte";
import TabsFixture from "../fixtures/Tabs.test.svelte";
import ToggleButtonGroupFixture from "../fixtures/ToggleButtonGroup.test.svelte";
import ToolbarFixture from "../fixtures/Toolbar.test.svelte";

const OPEN_API_QUESTION = {
  "aria-label": "open API question",
  "aria-labelledby": "open API question",
  "aria-describedby": "open API question",
} as const;

const dataTableProps = {
  title: "Users",
  description: "Active accounts",
  headers: [{ key: "name", value: "Name" }],
  rows: [{ id: "a", name: "Ada" }],
};

const first = (role: string) => screen.getAllByRole(role)[0];

export const navigation: AriaEntry[] = [
  {
    name: "ContentSwitcher",
    render: (attrs) => render(ContentSwitcherFixture, { props: attrs }),
    target: () => screen.getByRole("tablist"),
  },
  {
    name: "Switch",
    render: (attrs) =>
      render(ContentSwitcherFixture, { props: { under: "switch", ...attrs } }),
    target: () => first("tab"),
  },
  {
    name: "Switch",
    variant: "icon only",
    render: (attrs) =>
      render(ContentSwitcherFixture, {
        props: { under: "switch", iconOnly: true, ...attrs },
      }),
    target: () => first("tab"),
  },
  {
    name: "SwitchPanel",
    render: (attrs) =>
      render(ContentSwitcherFixture, { props: { under: "panel", ...attrs } }),
    // Panels pair with switches after a tick, so the first one is still hidden.
    target: (result) =>
      result.container.querySelector<HTMLElement>(
        '[role="tabpanel"]',
      ) as HTMLElement,
    skip: {
      "aria-label":
        "hidden panels have no name until pairing; SwitchPanel.test.ts covers it",
    },
  },
  {
    name: "DataTable",
    render: (attrs) =>
      render(DataTable, { props: { ...dataTableProps, ...attrs } }),
    target: () => screen.getByRole("table"),
  },
  {
    name: "DataTable",
    variant: "sticky header",
    render: (attrs) =>
      render(DataTable, {
        props: { ...dataTableProps, stickyHeader: true, ...attrs },
      }),
    target: () => screen.getByRole("table"),
  },
  {
    name: "TableHeader",
    render: (attrs) => render(TableHeaderFixture, { props: attrs }),
    target: () => screen.getByRole("columnheader"),
  },
  {
    name: "TableHeader",
    variant: "sortable",
    render: (attrs) =>
      render(TableHeaderFixture, { props: { sortable: true, ...attrs } }),
    target: () => screen.getByRole("columnheader"),
    skip: OPEN_API_QUESTION,
  },
  {
    name: "Toolbar",
    render: (attrs) => render(ToolbarFixture, { props: attrs }),
    target: (result) =>
      result.container.querySelector<HTMLElement>("section") as HTMLElement,
  },
  {
    name: "ToolbarSearch",
    render: (attrs) =>
      render(ToolbarFixture, { props: { under: "search", ...attrs } }),
    target: () => screen.getByRole("searchbox"),
  },
  {
    name: "ToolbarBatchActions",
    exempt:
      "Container for batch action buttons; its own Cancel button has a visible name",
  },
  {
    name: "HeaderAction",
    render: (attrs) =>
      render(HeaderAction, {
        props: { iconDescription: "Notifications", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "HeaderAction",
    variant: "text",
    render: (attrs) =>
      render(HeaderAction, { props: { text: "Apps", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "HeaderNav",
    render: (attrs) => render(HeaderNavFixture, { props: attrs }),
    target: () => screen.getByRole("navigation"),
  },
  {
    name: "HeaderNavItem",
    render: (attrs) =>
      render(HeaderNavFixture, { props: { under: "item", ...attrs } }),
    target: () => first("menuitem"),
  },
  {
    name: "HeaderNavMenu",
    render: (attrs) =>
      render(HeaderNavFixture, { props: { under: "menu", ...attrs } }),
    target: (result) =>
      result.container.querySelector<HTMLElement>(
        '[aria-haspopup="menu"]',
      ) as HTMLElement,
  },
  {
    name: "HeaderSearch",
    render: (attrs) => render(HeaderSearch, { props: attrs }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "HeaderSideNavItems",
    render: (attrs) => render(HeaderSideNavItems, { props: attrs }),
    target: () => screen.getByRole("menubar"),
  },
  {
    name: "HeaderSwitcher",
    render: (attrs) => render(HeaderSwitcher, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "HeaderSwitcher",
    variant: "text",
    render: (attrs) =>
      render(HeaderSwitcher, { props: { text: "Acme", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ProfileMenu",
    render: (attrs) => render(ProfileMenu, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ProfileMenuItem",
    render: (attrs) => render(ProfileMenuItemFixture, { props: attrs }),
    target: (result) =>
      result.container.querySelector<HTMLElement>(
        ".bx--profile-menu__item",
      ) as HTMLElement,
  },
  {
    name: "ProfileMenuItem",
    variant: "href",
    render: (attrs) =>
      render(ProfileMenuItemFixture, {
        props: { href: "/settings", ...attrs },
      }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "ProgressStep",
    render: (attrs) => render(ProgressStepFixture, { props: attrs }),
    target: () => first("button"),
  },
  {
    name: "OperationalTag",
    render: (attrs) => render(OperationalTag, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "SelectableTag",
    render: (attrs) => render(SelectableTag, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Tag",
    variant: "interactive",
    render: (attrs) => render(Tag, { props: { interactive: true, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Tag",
    variant: "href",
    render: (attrs) => render(Tag, { props: { href: "/tags", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "Tag",
    variant: "filter",
    render: (attrs) =>
      render(Tag, { props: { filter: true, type: "blue", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "TagSet",
    exempt:
      "Layout container for tags; its overflow trigger is named by overflowLabel",
  },
  {
    name: "SideNav",
    render: (attrs) => render(SideNav, { props: { isOpen: true, ...attrs } }),
    target: () => screen.getByRole("navigation"),
  },
  {
    name: "SideNavMenu",
    render: (attrs) =>
      render(SideNavMenu, { props: { text: "Settings", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "SkipToContent",
    render: (attrs) => render(SkipToContent, { props: attrs }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "Splitter",
    render: (attrs) => render(Splitter, { props: attrs }),
    target: () => screen.getByRole("separator"),
  },
  {
    name: "Tab",
    render: (attrs) =>
      render(TabsFixture, { props: { under: "tab", ...attrs } }),
    target: () => first("tab"),
  },
  {
    name: "TabContent",
    render: (attrs) =>
      render(TabsFixture, { props: { under: "content", ...attrs } }),
    target: () => screen.getByRole("tabpanel"),
  },
  {
    name: "Tabs",
    render: (attrs) => render(TabsFixture, { props: attrs }),
    target: () => screen.getByRole("navigation"),
    skip: OPEN_API_QUESTION,
  },
  {
    name: "TabsVertical",
    render: (attrs) =>
      render(TabsFixture, { props: { vertical: true, ...attrs } }),
    target: () => screen.getByRole("navigation"),
    skip: OPEN_API_QUESTION,
  },
  {
    name: "ToggleButton",
    render: (attrs) =>
      render(ToggleButtonGroupFixture, {
        props: { under: "button", ...attrs },
      }),
    target: () => first("button"),
  },
  {
    name: "ToggleButton",
    variant: "icon only",
    render: (attrs) =>
      render(ToggleButtonGroupFixture, {
        props: { under: "button", iconOnly: true, ...attrs },
      }),
    target: () => first("button"),
  },
  {
    name: "ToggleButtonGroup",
    render: (attrs) => render(ToggleButtonGroupFixture, { props: attrs }),
    target: () => screen.getByRole("toolbar"),
  },
  {
    name: "Table",
    render: (attrs) => render(TableFixture, { props: attrs }),
    target: () => screen.getByRole("table"),
  },
  {
    name: "Table",
    variant: "sticky header",
    render: (attrs) =>
      render(TableFixture, { props: { stickyHeader: true, ...attrs } }),
    target: () => screen.getByRole("table"),
  },
];
