import { render, screen } from "@testing-library/svelte";
import ButtonComponent from "carbon-components-svelte/Button/Button.svelte";
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";
import Divider from "carbon-components-svelte/Divider/Divider.svelte";
import FullPageError from "carbon-components-svelte/FullPageError/FullPageError.svelte";
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
import Meter from "carbon-components-svelte/Meter/Meter.svelte";
import Modal from "carbon-components-svelte/Modal/Modal.svelte";
import NotificationButton from "carbon-components-svelte/Notification/NotificationButton.svelte";
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import type { AriaEntry } from "../contract";
import AccordionItem from "../fixtures/AccordionItem.test.svelte";
import Button from "../fixtures/Button.test.svelte";
import CarouselItem from "../fixtures/CarouselItem.test.svelte";
import ClickableTile from "../fixtures/ClickableTile.test.svelte";
import ComposedModal from "../fixtures/ComposedModal.test.svelte";
import ContextMenu from "../fixtures/ContextMenu.test.svelte";
import ContextMenuOption from "../fixtures/ContextMenuOption.test.svelte";
import InterstitialScreen from "../fixtures/InterstitialScreen.test.svelte";
import Link from "../fixtures/Link.test.svelte";
import Menu from "../fixtures/Menu.test.svelte";
import MenuItem from "../fixtures/MenuItem.test.svelte";
import ModalBody from "../fixtures/ModalBody.test.svelte";
import OverflowMenuItem from "../fixtures/OverflowMenuItem.test.svelte";
import RadioTile from "../fixtures/RadioTile.test.svelte";
import SelectableTile from "../fixtures/SelectableTile.test.svelte";
import TooltipDefinition from "../fixtures/TooltipDefinition.test.svelte";

const nodes = [{ id: "docs", text: "Docs" }];

export const interactive: AriaEntry[] = [
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
    name: "Carousel",
    render: (attrs) => render(Carousel, { props: attrs }),
    target: () => screen.getByRole("region"),
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
    // jsdom never loads images, so render the loaded state directly. An
    // empty `src` keeps the component from starting a new load.
    render: (attrs) =>
      render(ImageLoader, { props: { alt: "Logo", loaded: true, ...attrs } }),
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
    name: "OverflowMenuItem",
    render: (attrs) => render(OverflowMenuItem, { props: attrs }),
    target: () => screen.getByRole("menuitem"),
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
];
