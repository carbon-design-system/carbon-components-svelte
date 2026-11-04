import { render, screen } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
import PaginationNav from "carbon-components-svelte/PaginationNav/PaginationNav.svelte";
import RecursiveList from "carbon-components-svelte/RecursiveList/RecursiveList.svelte";
import Splitter from "carbon-components-svelte/Splitter/Splitter.svelte";
import ColorTag from "carbon-components-svelte/Tag/ColorTag.svelte";
import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
import Tag from "carbon-components-svelte/Tag/Tag.svelte";
import Header from "carbon-components-svelte/UIShell/Header.svelte";
import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
import HeaderActionLink from "carbon-components-svelte/UIShell/HeaderActionLink.svelte";
import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
import ProfileMenuHeader from "carbon-components-svelte/UIShell/ProfileMenuHeader.svelte";
import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";
import type { AriaEntry } from "../contract";
import ContentSwitcherFixture from "../fixtures/ContentSwitcher.test.svelte";
import HeaderGlobalActionFixture from "../fixtures/HeaderGlobalAction.test.svelte";
import HeaderNavFixture from "../fixtures/HeaderNav.test.svelte";
import ProfileMenuItemFixture from "../fixtures/ProfileMenuItem.test.svelte";
import ProgressStepFixture from "../fixtures/ProgressStep.test.svelte";
import SideNavFixture from "../fixtures/SideNav.test.svelte";
import StructuredListFixture from "../fixtures/StructuredList.test.svelte";
import TableFixture from "../fixtures/Table.test.svelte";
import TableHeaderFixture from "../fixtures/TableHeader.test.svelte";
import TableOfContentsItemFixture from "../fixtures/TableOfContentsItem.test.svelte";
import TabsFixture from "../fixtures/Tabs.test.svelte";
import ToggleButtonGroupFixture from "../fixtures/ToggleButtonGroup.test.svelte";
import ToolbarFixture from "../fixtures/Toolbar.test.svelte";
import ToolbarActionsFixture from "../fixtures/ToolbarActions.test.svelte";
import ToolbarMenuFixture from "../fixtures/ToolbarMenu.test.svelte";

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

// Side nav links keep their text name until a consumer label replaces it.
const HOME_LINK = /Home|Contract/;
const PROFILE_LINK = /Profile|Contract/;

/** The attributes land on a root with no role, and no single control fits. */
const NO_ROLE_ROOT = {
  "aria-label": "root has no role; target not decided",
  "aria-labelledby": "root has no role; target not decided",
  "aria-describedby": "root has no role; target not decided",
} as const;

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
    name: "ColorTag",
    variant: "interactive",
    render: (attrs) =>
      render(ColorTag, { props: { interactive: true, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ColorTag",
    variant: "href",
    render: (attrs) => render(ColorTag, { props: { href: "/tags", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "ColorTag",
    variant: "filter",
    render: (attrs) => render(ColorTag, { props: { filter: true, ...attrs } }),
    target: () => screen.getByRole("button"),
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
  {
    name: "Header",
    render: (attrs) =>
      render(Header, {
        props: {
          companyName: "IBM",
          platformName: "Cloud",
          href: "/",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("banner"),
  },
  {
    name: "Header",
    variant: "no name link",
    render: (attrs) => render(Header, { props: attrs }),
    target: () => screen.getByRole("banner"),
  },
  {
    name: "HeaderActionLink",
    render: (attrs) =>
      render(HeaderActionLink, { props: { href: "/apps", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "HeaderGlobalAction",
    render: (attrs) =>
      render(HeaderGlobalAction, {
        props: { iconDescription: "Notifications", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "HeaderGlobalAction",
    variant: "badge",
    render: (attrs) => render(HeaderGlobalActionFixture, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ProfileMenuHeader",
    variant: "href",
    render: (attrs) =>
      render(ProfileMenuHeader, {
        props: { name: "Ada", href: "/profile", ...attrs },
      }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "SideNavLink",
    render: (attrs) => render(SideNavFixture, { props: attrs }),
    target: () => screen.getByRole("link", { name: HOME_LINK }),
  },
  {
    name: "SideNavMenuItem",
    render: (attrs) =>
      render(SideNavFixture, { props: { under: "menu-item", ...attrs } }),
    target: () => screen.getByRole("link", { name: PROFILE_LINK }),
  },
  {
    name: "Pagination",
    render: (attrs) =>
      render(Pagination, { props: { totalItems: 30, ...attrs } }),
    target: (result) => result.container.firstElementChild as HTMLElement,
    skip: NO_ROLE_ROOT,
  },
  {
    name: "PaginationNav",
    render: (attrs) => render(PaginationNav, { props: attrs }),
    target: () => screen.getByRole("navigation"),
  },
  {
    name: "TableOfContentsItem",
    render: (attrs) => render(TableOfContentsItemFixture, { props: attrs }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "ToolbarColumnVisibility",
    render: (attrs) => render(ToolbarActionsFixture, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ToolbarDensity",
    render: (attrs) =>
      render(ToolbarActionsFixture, { props: { under: "density", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ToolbarMenu",
    render: (attrs) => render(ToolbarMenuFixture, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ToolbarMenuItem",
    render: (attrs) =>
      render(ToolbarMenuFixture, { props: { under: "item", ...attrs } }),
    target: () => screen.getByRole("menuitem"),
  },
  {
    name: "RecursiveList",
    render: (attrs) =>
      render(RecursiveList, {
        props: {
          nodes: [{ text: "Docs", nodes: [{ text: "Install" }] }],
          ...attrs,
        },
      }),
    target: () => first("list"),
  },
  {
    name: "RecursiveList",
    variant: "ordered",
    render: (attrs) =>
      render(RecursiveList, {
        props: { type: "ordered", nodes: [{ text: "Docs" }], ...attrs },
      }),
    target: () => screen.getByRole("list"),
  },
  {
    name: "StructuredList",
    render: (attrs) => render(StructuredListFixture, { props: attrs }),
    target: () => screen.getByRole("table"),
  },
  {
    name: "StructuredList",
    variant: "selection",
    render: (attrs) =>
      render(StructuredListFixture, { props: { selection: true, ...attrs } }),
    // The radiogroup role is on StructuredListBody; the root has none.
    target: () => screen.getByRole("radiogroup"),
    skip: NO_ROLE_ROOT,
  },
  {
    name: "Stack",
    exempt: "Layout wrapper; renders the element or component it is given",
  },
  {
    name: "UserAvatarGroup",
    exempt:
      "Layout row of avatars; its +N overflow avatar is named by its count",
  },
];
