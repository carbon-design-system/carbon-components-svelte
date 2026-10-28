import { render, screen } from "@testing-library/svelte";
import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
import BigNumber from "carbon-components-svelte/BigNumber/BigNumber.svelte";
import ButtonComponent from "carbon-components-svelte/Button/Button.svelte";
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import ChatLog from "carbon-components-svelte/Chat/ChatLog.svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
import ConfirmModal from "carbon-components-svelte/ConfirmModal/ConfirmModal.svelte";
import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
import CopyText from "carbon-components-svelte/CopyText/CopyText.svelte";
import Countdown from "carbon-components-svelte/Countdown/Countdown.svelte";
import Dialog from "carbon-components-svelte/Dialog/Dialog.svelte";
import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";
import Divider from "carbon-components-svelte/Divider/Divider.svelte";
import FileDownloadItem from "carbon-components-svelte/FileUploader/FileDownloadItem.svelte";
import FullPageError from "carbon-components-svelte/FullPageError/FullPageError.svelte";
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
import Loading from "carbon-components-svelte/Loading/Loading.svelte";
import LogViewer from "carbon-components-svelte/LogViewer/LogViewer.svelte";
import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
import Meter from "carbon-components-svelte/Meter/Meter.svelte";
import Modal from "carbon-components-svelte/Modal/Modal.svelte";
import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
import NotificationButton from "carbon-components-svelte/Notification/NotificationButton.svelte";
import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import Popover from "carbon-components-svelte/Popover/Popover.svelte";
import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";
import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import Truncate from "carbon-components-svelte/Truncate/Truncate.svelte";
import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import type { AriaEntry } from "../contract";
import AccordionItem from "../fixtures/AccordionItem.test.svelte";
import BreadcrumbItemFixture from "../fixtures/BreadcrumbItem.test.svelte";
import Button from "../fixtures/Button.test.svelte";
import Card from "../fixtures/Card.test.svelte";
import CarouselItem from "../fixtures/CarouselItem.test.svelte";
import ChatButton from "../fixtures/ChatButton.test.svelte";
import ClickableTile from "../fixtures/ClickableTile.test.svelte";
import ComposedModal from "../fixtures/ComposedModal.test.svelte";
import ContextMenu from "../fixtures/ContextMenu.test.svelte";
import ContextMenuOption from "../fixtures/ContextMenuOption.test.svelte";
import InterstitialScreen from "../fixtures/InterstitialScreen.test.svelte";
import InterstitialScreenBody from "../fixtures/InterstitialScreenBody.test.svelte";
import Link from "../fixtures/Link.test.svelte";
import LinkDownload from "../fixtures/LinkDownload.test.svelte";
import Menu from "../fixtures/Menu.test.svelte";
import MenuItem from "../fixtures/MenuItem.test.svelte";
import ModalBody from "../fixtures/ModalBody.test.svelte";
import NotificationActionButton from "../fixtures/NotificationActionButton.test.svelte";
import NotificationActionButtonInCallout from "../fixtures/NotificationActionButtonInCallout.test.svelte";
import OutboundLink from "../fixtures/OutboundLink.test.svelte";
import OverflowMenuItem from "../fixtures/OverflowMenuItem.test.svelte";
import RadioTile from "../fixtures/RadioTile.test.svelte";
import SelectableTile from "../fixtures/SelectableTile.test.svelte";
import TooltipDefinition from "../fixtures/TooltipDefinition.test.svelte";

const nodes = [{ id: "docs", text: "Docs" }];

export const interactive: AriaEntry[] = [
  {
    name: "AILabel",
    render: (attrs) => render(AILabel, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "AILabel",
    variant: "revert",
    render: (attrs) =>
      render(AILabel, { props: { revertActive: true, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "AccordionItem",
    render: (attrs) => render(AccordionItem, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Button",
    render: (attrs) => render(Button, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Button",
    variant: "href",
    render: (attrs) => render(Button, { props: { href: "/docs", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "Button",
    variant: "icon only",
    render: (attrs) =>
      render(ButtonComponent, {
        props: { icon: Add, iconDescription: "Add", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ChatButton",
    render: (attrs) => render(ChatButton, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ChatButton",
    variant: "quick action",
    render: (attrs) =>
      render(ChatButton, {
        props: { quickAction: true, selected: true, ...attrs },
      }),
    target: () => screen.getByRole("button", { pressed: true }),
  },
  {
    name: "Carousel",
    render: (attrs) => render(Carousel, { props: attrs }),
    target: () => screen.getByRole("region"),
  },
  {
    name: "Card",
    render: (attrs) => render(Card, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Card",
    variant: "href",
    render: (attrs) => render(Card, { props: { href: "/report", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "CarouselItem",
    render: (attrs) => render(CarouselItem, { props: attrs }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "ClickableTile",
    render: (attrs) => render(ClickableTile, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ClickableTile",
    variant: "href",
    render: (attrs) =>
      render(ClickableTile, { props: { href: "/report", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "CodeSnippet",
    render: (attrs) =>
      render(CodeSnippet, { props: { code: "npm i", ...attrs } }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "CodeSnippet",
    variant: "multi",
    render: (attrs) =>
      render(CodeSnippet, {
        props: { type: "multi", code: "npm i\nnpm t", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "CodeSnippet",
    variant: "inline",
    render: (attrs) =>
      render(CodeSnippet, {
        props: { type: "inline", code: "npm i", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ComposedModal",
    render: (attrs) => render(ComposedModal, { props: attrs }),
    target: () => screen.getByRole("alertdialog"),
  },
  {
    name: "ContextMenu",
    render: (attrs) => render(ContextMenu, { props: attrs }),
    target: () => screen.getByRole("menu"),
  },
  {
    name: "ContextMenuOption",
    render: (attrs) => render(ContextMenuOption, { props: attrs }),
    target: () => screen.getByRole("menuitem"),
  },
  {
    name: "CopyButton",
    render: (attrs) => render(CopyButton, { props: { text: "abc", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "CopyText",
    render: (attrs) => render(CopyText, { props: { text: "abc", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Disclosure",
    render: (attrs) =>
      render(Disclosure, { props: { summary: "More", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Divider",
    render: (attrs) => render(Divider, { props: attrs }),
    target: () => screen.getByRole("separator"),
  },
  {
    name: "ExpandableTile",
    render: (attrs) => render(ExpandableTile, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ExpandableTile",
    variant: "interactive content",
    render: (attrs) =>
      render(ExpandableTile, {
        props: { hasInteractiveContent: true, ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "FullPageError",
    render: (attrs) =>
      render(FullPageError, {
        props: { labelText: "Error 404", title: "Not found", ...attrs },
      }),
    target: () => screen.getByRole("main"),
  },
  {
    name: "ImageLoader",
    // jsdom never loads images, so stub `Image` to settle as soon as the
    // component listens, rendering the loaded state.
    render: (attrs) => {
      vi.stubGlobal(
        "Image",
        class {
          src = "";
          onerror = null;
          set onload(callback: () => void) {
            callback();
          }
        },
      );
      try {
        return render(ImageLoader, {
          props: { src: "logo.png", alt: "Logo", ...attrs },
        });
      } finally {
        vi.unstubAllGlobals();
      }
    },
    target: () => screen.getByRole("img"),
  },
  {
    name: "InterstitialScreen",
    render: (attrs) => render(InterstitialScreen, { props: attrs }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "InterstitialScreen",
    variant: "full screen",
    render: (attrs) =>
      render(InterstitialScreen, { props: { isFullScreen: true, ...attrs } }),
    target: () => screen.getByRole("main"),
  },
  {
    name: "InterstitialScreenHeader",
    exempt:
      "header container; its close button is a fixed control named by iconDescription",
  },
  {
    name: "Link",
    render: (attrs) => render(Link, { props: { href: "/docs", ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "Link",
    variant: "disabled",
    render: (attrs) => render(Link, { props: { disabled: true, ...attrs } }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "Loading",
    render: (attrs) => render(Loading, { props: attrs }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "Menu",
    render: (attrs) => render(Menu, { props: attrs }),
    target: () => screen.getByRole("menu"),
  },
  {
    name: "MenuButton",
    render: (attrs) =>
      render(MenuButton, { props: { labelText: "Actions", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "MenuButton",
    variant: "icon only",
    render: (attrs) =>
      render(MenuButton, {
        props: { labelText: "Actions", iconOnly: true, ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "MenuItem",
    render: (attrs) => render(MenuItem, { props: attrs }),
    target: () => screen.getByRole("menuitem"),
  },
  {
    name: "Meter",
    render: (attrs) =>
      render(Meter, {
        props: {
          labelText: "Storage",
          helperText: "Resets monthly",
          value: 40,
          ...attrs,
        },
      }),
    target: () => screen.getByRole("meter"),
  },
  {
    name: "Modal",
    render: (attrs) =>
      render(Modal, {
        props: { open: true, alert: true, modalHeading: "Delete", ...attrs },
      }),
    target: () => screen.getByRole("alertdialog"),
  },
  {
    name: "Modal",
    variant: "label and scrolling content",
    render: (attrs) =>
      render(Modal, {
        props: {
          open: true,
          modalLabel: "Account",
          modalHeading: "Terms",
          hasScrollingContent: true,
          ...attrs,
        },
      }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "ModalBody",
    variant: "scrolling content",
    render: (attrs) => render(ModalBody, { props: attrs }),
    target: () => screen.getByRole("region"),
  },
  {
    name: "ModalHeader",
    exempt:
      "header container; its close button is a fixed control named by iconDescription",
  },
  {
    name: "NotificationButton",
    render: (attrs) => render(NotificationButton, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "OverflowMenu",
    render: (attrs) => render(OverflowMenu, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "OverflowMenu",
    variant: "open",
    render: (attrs) =>
      render(OverflowMenu, { props: { open: true, ...attrs } }),
    // An aria-label names the menu as well as its trigger.
    target: () => [screen.getByRole("button"), screen.getByRole("menu")],
    skip: {
      "aria-labelledby": "lands on the trigger only; the closed case covers it",
      "aria-describedby":
        "lands on the trigger only; the closed case covers it",
    },
  },
  {
    name: "OverflowMenuItem",
    render: (attrs) => render(OverflowMenuItem, { props: attrs }),
    target: () => screen.getByRole("menuitem"),
  },
  {
    // Popover has no role of its own; a consumer role and naming land on
    // the popover, in place or in a portal.
    name: "Popover",
    render: (attrs) =>
      render(Popover, { props: { open: true, role: "dialog", ...attrs } }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "Popover",
    variant: "in a portal",
    render: (attrs) =>
      render(Popover, {
        props: { open: true, portalPopover: true, role: "dialog", ...attrs },
      }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "ProgressBar",
    render: (attrs) =>
      render(ProgressBar, {
        props: {
          labelText: "Upload",
          helperText: "2 of 5 files",
          value: 40,
          ...attrs,
        },
      }),
    target: () => screen.getByRole("progressbar"),
  },
  {
    name: "RadioTile",
    render: (attrs) => render(RadioTile, { props: attrs }),
    target: () => screen.getByRole("radio"),
  },
  {
    name: "SelectableTile",
    render: (attrs) => render(SelectableTile, { props: attrs }),
    target: () => screen.getByRole("checkbox"),
  },
  {
    name: "SelectableTileGroup",
    render: (attrs) =>
      render(SelectableTileGroup, { props: { legendText: "Plans", ...attrs } }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "SidePanel",
    render: (attrs) =>
      render(SidePanel, {
        props: {
          open: true,
          title: "Edit deployment",
          subtitle: "Changes apply on the next deploy.",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "Toggletip",
    render: (attrs) => render(Toggletip, { props: { open: true, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Tooltip",
    render: (attrs) => render(Tooltip, { props: { open: true, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Tooltip",
    variant: "trigger text",
    render: (attrs) =>
      render(Tooltip, {
        props: { open: true, hideIcon: true, triggerText: "Info", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "TooltipDefinition",
    render: (attrs) => render(TooltipDefinition, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "TooltipIcon",
    render: (attrs) =>
      render(TooltipIcon, {
        props: { tooltipText: "Help", icon: Add, ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "TooltipIcon",
    variant: "portal",
    render: (attrs) =>
      render(TooltipIcon, {
        props: {
          tooltipText: "Help",
          icon: Add,
          portalTooltip: true,
          ...attrs,
        },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "TreeView",
    render: (attrs) =>
      render(TreeView, { props: { labelText: "Files", nodes, ...attrs } }),
    target: () => screen.getByRole("tree"),
  },
  {
    name: "TreeView",
    variant: "virtualized",
    render: (attrs) =>
      render(TreeView, {
        props: { labelText: "Files", nodes, virtualize: true, ...attrs },
      }),
    target: () => screen.getByRole("tree"),
  },
  {
    name: "BreadcrumbItem",
    variant: "href",
    render: (attrs) => render(BreadcrumbItemFixture, { props: attrs }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "BreadcrumbItem",
    variant: "no-href",
    // Without an href there is no link, so the item keeps the attributes.
    render: (attrs) =>
      render(BreadcrumbItemFixture, { props: { href: "", ...attrs } }),
    target: () => screen.getByRole("listitem"),
  },
  {
    name: "ComboButton",
    render: (attrs) =>
      render(ComboButton, { props: { labelText: "Save", ...attrs } }),
    target: () => screen.getAllByRole("button")[0],
  },
  {
    name: "UserAvatar",
    variant: "tooltip",
    render: (attrs) =>
      render(UserAvatar, {
        props: { name: "Ada Lovelace", tooltipText: "Ada Lovelace", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "BigNumber",
    render: (attrs) =>
      render(BigNumber, {
        props: { labelText: "Requests", value: 1200, ...attrs },
      }),
    target: () => screen.getByRole("figure"),
  },
  {
    name: "BigNumber",
    variant: "tooltip",
    render: (attrs) =>
      render(BigNumber, {
        props: {
          labelText: "Requests",
          value: 1200,
          tooltipDescription: "Last 24 hours",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("figure"),
  },
  {
    name: "Dialog",
    render: (attrs) => render(Dialog, { props: { open: true, ...attrs } }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "Dialog",
    variant: "modal",
    render: (attrs) =>
      render(Dialog, { props: { open: true, modal: true, ...attrs } }),
    target: () => screen.getByRole("dialog"),
  },
  {
    name: "ChatMessage",
    exempt:
      "message list item; its Retry button is named by retryText and its typing status by typingText",
  },
  {
    name: "FileDownloadItem",
    render: (attrs) =>
      render(FileDownloadItem, {
        props: { href: "/files/report.pdf", name: "report.pdf", ...attrs },
      }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "FileUploaderItem",
    exempt:
      "file row container; its Filename control is named by iconDescription",
  },
  {
    name: "FloatingPortal",
    exempt: "positioning wrapper; the slotted content carries its own role",
  },
  {
    name: "IconIndicator",
    exempt:
      "visible label with a decorative icon; no focusable or role element",
  },
  {
    name: "InlineLoading",
    render: (attrs) =>
      render(InlineLoading, { props: { description: "Saving", ...attrs } }),
    target: () => screen.getByRole("status"),
  },
  {
    name: "InlineLoading",
    variant: "error",
    render: (attrs) =>
      render(InlineLoading, {
        props: { status: "error", description: "Failed", ...attrs },
      }),
    target: () => screen.getByRole("alert"),
  },
  {
    name: "Callout",
    exempt:
      "static notice with no role or focusable element; its action is described by the title",
  },
  {
    name: "InlineNotification",
    render: (attrs) =>
      render(InlineNotification, {
        props: { title: "Error", subtitle: "Try again", ...attrs },
      }),
    target: () => screen.getByRole("status"),
  },
  {
    name: "InlineNotification",
    variant: "actionable",
    render: (attrs) =>
      render(InlineNotification, {
        props: {
          actionable: true,
          focusOnOpen: false,
          title: "Error",
          subtitle: "Try again",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("alertdialog"),
  },
  {
    name: "InterstitialScreenBody",
    render: (attrs) => render(InterstitialScreenBody, { props: attrs }),
    target: () => screen.getByRole("region"),
  },
  {
    name: "InterstitialScreenFooter",
    exempt:
      "footer container; its buttons are fixed controls named by their text",
  },
  {
    name: "LinkDownload",
    render: (attrs) => render(LinkDownload, { props: attrs }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "ListBoxMenuIcon",
    exempt:
      "chevron inside the list box field; its icon is named by translateWithId",
  },
  {
    name: "ModalFooter",
    exempt:
      "footer container; its buttons are fixed controls named by their text",
  },
  {
    name: "NotificationActionButton",
    render: (attrs) => render(NotificationActionButton, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "NotificationActionButton",
    variant: "in a Callout",
    render: (attrs) =>
      render(NotificationActionButtonInCallout, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "OutboundLink",
    render: (attrs) => render(OutboundLink, { props: attrs }),
    target: () => screen.getByRole("link"),
  },
  {
    name: "ShapeIndicator",
    exempt:
      "visible label with a decorative shape; no focusable or role element",
  },
  {
    name: "ToastNotification",
    render: (attrs) =>
      render(ToastNotification, {
        props: {
          title: "Saved",
          subtitle: "All changes saved",
          caption: "Just now",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("status"),
  },
  {
    name: "ToastNotification",
    variant: "actionable",
    render: (attrs) =>
      render(ToastNotification, {
        props: {
          actionable: true,
          focusOnOpen: false,
          title: "Saved",
          subtitle: "All changes saved",
          caption: "Just now",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("alertdialog"),
  },
  {
    name: "ConfirmModal",
    render: (attrs) =>
      render(ConfirmModal, {
        props: { open: true, title: "Delete this project?", ...attrs },
      }),
    target: () => screen.getByRole("alertdialog"),
  },
  {
    name: "Countdown",
    render: (attrs) => render(Countdown, { props: { seconds: 90, ...attrs } }),
    target: () => screen.getByRole("timer"),
  },
  {
    name: "ChatLog",
    render: (attrs) =>
      render(ChatLog, { props: { labelText: "Conversation", ...attrs } }),
    target: () => screen.getByRole("log"),
  },
  {
    name: "LogViewer",
    render: (attrs) =>
      render(LogViewer, {
        props: { lines: ["INFO started"], labelText: "Build output", ...attrs },
      }),
    target: () => screen.getByRole("log"),
  },
  {
    // The text takes focus while clipped; the expand toggle has its own
    // visible label.
    name: "Truncate",
    render: (attrs) =>
      render(Truncate, { props: { reveal: "tooltip", ...attrs } }),
    target: (result) =>
      result.container.querySelector<HTMLElement>("p") as HTMLElement,
  },
];
