<script>
  /**
   * @typedef {object} DockDocument
   * @property {string} id - Names the tab. Unique among the documents, and the id the layout holds.
   * @property {string} label - The tab's name.
   * @property {boolean} [modified] - Set to `true` to mark the tab with a dot.
   * @property {boolean} [disabled] - Set to `true` to disable the tab.
   */

  /**
   * A node of the layout tree: a group of tabs, or a row or column of nodes.
   * @typedef {import("../utils/dock-layout.js").DockNode} DockLayoutNode
   */

  /**
   * @typedef {object} DockLayoutChange
   * @property {"move" | "split" | "close" | "activate" | "resize"} type - What changed. `move` joins a group or reorders its tabs, `split` makes a new group beside one.
   * @property {DockLayoutNode} layout - The layout after the change.
   * @property {DockLayoutNode} previous - The layout before it.
   * @property {"pointer" | "keyboard" | "menu"} source - What asked for it. A pointer drag, a key, or the tab's menu; `pointer` also covers the separators.
   * @property {string} [tabId] - The tab that moved, split, closed or activated.
   * @property {string} [groupId] - The group it moved to or split from.
   */

  /**
   * @event {DockLayoutChange} layoutchange - Dispatched before the layout changes. `move`, `split` and `close` are cancelable: call `preventDefault()` to keep the layout as it is, for example while asking whether to discard a modified document. `activate` and `resize` are not.
   * @slot {{ document: DockDocument; groupId: string }} panel - The content of a document. Mounted when the document first shows.
   * @slot {{}} empty - Shown in a group with no tab.
   * @restProps {div}
   */

  /**
   * The layout: a tree of splits whose leaves are groups of tab ids.
   * Tabs the documents do not hold are left out, and a group left with
   * none collapses. See `normalizeDockLayout` for the repairs the layout gets.
   * @type {DockLayoutNode}
   * @bindable writable
   */
  export let layout = { type: "group", id: "group-1", tabs: [] };

  /**
   * The documents the tabs stand for. A document the layout does not place
   * has no tab: add it to the layout (see `reconcile`).
   * @type {ReadonlyArray<DockDocument>}
   */
  export let documents = [];

  /**
   * The id of the group with the focus, or the last that had it. Defaults to
   * the first group.
   * @type {string | null}
   * @bindable writable
   */
  export let activeGroupId = null;

  /**
   * The id of the group that fills the dock, or `null` for none. The other
   * groups stay mounted, and inert.
   * @type {string | null}
   * @bindable writable
   */
  export let maximized = null;

  /**
   * Specify the tab type.
   * @type {"default" | "container"}
   */
  export let type = "container";

  /**
   * Specify the tab size.
   * @type {"sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `false` to hide the close button on tabs. */
  export let dismissible = true;

  /**
   * Set to `false` to mount every document's panel at once, rather than when
   * it first shows.
   */
  export let lazy = true;

  /** Specify the text shown in a group with no tab. */
  export let emptyText = "No open documents";

  /**
   * Specify the name of a group's region.
   * @type {(params: { index: number; count: number; label: string | undefined }) => string}
   */
  export let groupLabelText = function groupLabelText({ index, count, label }) {
    return label
      ? `Group ${index} of ${count}, ${label}`
      : `Group ${index} of ${count}`;
  };

  /**
   * Specify the name of a group's tab strip, a navigation landmark of its own.
   * @type {(params: { index: number; count: number }) => string}
   */
  export let stripLabelText = function stripLabelText({ index }) {
    return `Group ${index} tabs`;
  };

  /**
   * Specify the name of the groups a separator sits between.
   * @type {(params: { first: number; last: number }) => string}
   */
  export let groupName = function groupName({ first, last }) {
    return first === last ? `group ${first}` : `groups ${first} to ${last}`;
  };

  /**
   * Specify the name of a separator.
   * @type {(params: { before: string; after: string }) => string}
   */
  export let resizeLabelText = function resizeLabelText({ before, after }) {
    return `Resize ${before} and ${after}`;
  };

  /**
   * Specify what the live region says after a tab moves.
   * `position` is where it went, as a physical side for a split.
   * @type {(params: { action: "move" | "split" | "close" | "blocked"; label: string; position?: "left" | "right" | "above" | "below"; group?: number; count?: number }) => string}
   */
  export let announcementText = function announcementText({
    action,
    label,
    position,
    group,
    count,
  }) {
    if (action === "close") return `Closed ${label}`;
    if (action === "blocked") {
      return `${label} has no group ${position} of it, and is the only tab in its group`;
    }
    if (action === "split") {
      return `Split ${label} to a new group ${position}. Group ${group} of ${count}`;
    }
    return `Moved ${label} to group ${group} of ${count}`;
  };

  /**
   * Specify the text of the tab menu. Merged over the defaults.
   * @type {Partial<{ label: string; splitLeft: string; splitRight: string; splitUp: string; splitDown: string; moveTo: string; moveToGroup: (params: { index: number; label: string | undefined }) => string; maximize: string; restore: string; close: string }>}
   */
  export let menuText = {};

  /**
   * Set an id for the top-level element.
   * The ids of the tab menu options derive from it.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import ContextMenu from "../ContextMenu/ContextMenu.svelte";
  import ContextMenuDivider from "../ContextMenu/ContextMenuDivider.svelte";
  import ContextMenuOption from "../ContextMenu/ContextMenuOption.svelte";
  import { dockDrag } from "../utils/dock-drag.js";
  import {
    activate as activateTab,
    closeDockTab as closeTab,
    dockTab,
    findTab,
    groups as groupsOf,
    moveDockTab as moveTab,
    neighbor,
    normalizeDockLayout as normalize,
    resize as resizeLayout,
    splitDockTab as splitTab,
  } from "../utils/dock-layout.js";
  import { matchesShortcut } from "../utils/keyboard-shortcut.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { uniqueId } from "../utils/unique-id.js";
  import DockNode from "./DockNode.svelte";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  const MENU_TEXT = {
    label: "Tab actions",
    splitLeft: "Split left",
    splitRight: "Split right",
    splitUp: "Split up",
    splitDown: "Split down",
    moveTo: "Move to group",
    moveToGroup: (
      /** @type {{ index: number; label: string | undefined }} */ {
        index,
        label,
      },
    ) => (label ? `Group ${index}: ${label}` : `Group ${index}`),
    maximize: "Maximize group",
    restore: "Restore group",
    close: "Close",
  };

  $: menu = { ...MENU_TEXT, ...menuText };

  // What the tree renders: the layout, less the tabs that have no document.
  $: view = normalize(layout, {
    known: documents.map((document) => document.id),
  });
  $: allGroups = groupsOf(view);
  $: groupNumbers = new Map(allGroups.map((group, i) => [group.id, i + 1]));
  $: resolvedActiveGroupId = allGroups.some((g) => g.id === activeGroupId)
    ? /** @type {string} */ (activeGroupId)
    : allGroups[0].id;
  $: resolvedMaximized =
    maximized !== null && allGroups.length > 1 && groupNumbers.has(maximized)
      ? maximized
      : null;
  $: documentsById = Object.fromEntries(
    documents.map((document) => [document.id, document]),
  );
  $: rtl = resolveLayoutDirection($layoutDirection, ref) === "rtl";

  /** @type {import("svelte/store").Writable<import("./types.js").DockShared>} */
  const shared = writable({
    documentsById: {},
    groupNumbers: new Map(),
    activeGroupId: "",
    maximized: null,
    type: "container",
    size: undefined,
    dismissible: true,
    lazy: true,
    emptyText: "",
    groupLabelText,
    stripLabelText,
    resizeLabelText,
    groupName,
  });
  $: shared.set({
    documentsById,
    groupNumbers,
    activeGroupId: resolvedActiveGroupId,
    maximized: resolvedMaximized,
    type,
    size,
    dismissible,
    lazy,
    emptyText,
    groupLabelText,
    stripLabelText,
    resizeLabelText,
    groupName,
  });

  /**
   * Apply a change, unless a `layoutchange` handler refuses it.
   * @param {import("../utils/dock-layout.js").DockNode} next
   * @param {Omit<DockLayoutChange, "layout" | "previous">} detail
   * @param {boolean} [cancelable]
   * @returns {boolean} Whether the layout changed.
   */
  function commit(next, detail, cancelable = true) {
    if (next === view) return false;
    const proceed = dispatch(
      "layoutchange",
      { ...detail, layout: next, previous: layout },
      { cancelable },
    );
    if (!proceed) return false;
    layout = next;
    return true;
  }

  const REPEAT_TAIL = " ";
  let announcement = "";

  /** @param {string} message */
  function announce(message) {
    // A live region does not read text that did not change.
    const tailed = announcement.endsWith(REPEAT_TAIL);
    announcement =
      message === (tailed ? announcement.slice(0, -1) : announcement) && !tailed
        ? message + REPEAT_TAIL
        : message;
  }

  /** @param {string} tabId */
  const labelOf = (tabId) => documentsById[tabId]?.label ?? tabId;

  /**
   * Put the focus on a tab once the DOM shows it where it now is.
   * @param {string} tabId
   */
  async function focusTab(tabId) {
    await tick();
    const find = () =>
      Array.from(ref?.querySelectorAll("[role='tab']") ?? []).find(
        (tab) => tab.id === tabId,
      );
    let tab = find();
    // A group that was just made registers its tabs after it mounts.
    if (!tab) {
      await tick();
      tab = find();
    }
    if (tab instanceof HTMLElement) tab.focus({ preventScroll: false });
  }

  /**
   * Put the focus on a group's selected tab, or the group itself when empty.
   * @param {string} groupId
   */
  function focusGroup(groupId) {
    const element = Array.from(
      ref?.querySelectorAll("[data-dock-group]") ?? [],
    ).find(
      (el) => el instanceof HTMLElement && el.dataset.dockGroup === groupId,
    );
    if (!(element instanceof HTMLElement)) return;
    const tab =
      element.querySelector("[role='tab'][aria-selected='true']") ??
      element.querySelector("[role='tab']");
    (tab instanceof HTMLElement ? tab : element).focus();
  }

  /** @param {string} groupId */
  function setActiveGroup(groupId) {
    if (groupId !== activeGroupId) activeGroupId = groupId;
  }

  /**
   * @param {"left" | "right" | "up" | "down"} side
   * @returns {import("../utils/dock-layout.js").DockEdge}
   */
  function edgeOf(side) {
    if (side === "left") return rtl ? "end" : "start";
    if (side === "right") return rtl ? "start" : "end";
    return side === "up" ? "top" : "bottom";
  }

  /**
   * @param {import("../utils/dock-layout.js").DockEdge} edge
   * @returns {"left" | "right" | "above" | "below"}
   */
  function sideWord(edge) {
    if (edge === "top") return "above";
    if (edge === "bottom") return "below";
    return (edge === "start") === rtl ? "right" : "left";
  }

  /**
   * @param {import("../utils/dock-layout.js").DockDirection} direction
   * @returns {import("../utils/dock-layout.js").DockEdge}
   */
  function directionEdge(direction) {
    if (direction === "up") return "top";
    return direction === "down" ? "bottom" : direction;
  }

  /**
   * @param {string} tabId
   * @param {"pointer" | "keyboard" | "menu"} source
   * @param {import("../utils/dock-layout.js").DockNode} next
   * @param {"move" | "split"} kind
   * @param {string} groupId
   * @param {import("../utils/dock-layout.js").DockEdge} [edge] - For a split.
   */
  function finishDock(tabId, source, next, kind, groupId, edge) {
    const changed = commit(next, { type: kind, source, tabId, groupId });
    if (!changed) return false;
    const group = findTab(next, tabId);
    const numbers = new Map(groupsOf(next).map((g, i) => [g.id, i + 1]));
    announce(
      announcementText({
        action: kind,
        label: labelOf(tabId),
        position: edge ? sideWord(edge) : undefined,
        group: group ? numbers.get(group.id) : undefined,
        count: numbers.size,
      }),
    );
    focusTab(tabId);
    return true;
  }

  /**
   * @param {string} tabId
   * @param {import("../utils/dock-layout.js").DockEdge} edge
   * @param {"keyboard" | "menu" | "pointer"} source
   * @param {string} [groupId]
   */
  function splitOff(tabId, edge, source, groupId) {
    const from = findTab(view, tabId);
    if (!from) return false;
    return finishDock(
      tabId,
      source,
      splitTab(view, tabId, groupId ?? from.id, edge),
      "split",
      groupId ?? from.id,
      edge,
    );
  }

  /**
   * Move a tab to the group beside its own in a direction, or split it off
   * that way when there is none.
   * @param {string} tabId
   * @param {import("../utils/dock-layout.js").DockDirection} direction
   */
  function moveOrSplit(tabId, direction) {
    const from = findTab(view, tabId);
    if (!from) return;
    const next = neighbor(view, from.id, direction);
    if (next) {
      finishDock(tabId, "keyboard", moveTab(view, tabId, next), "move", next);
    } else if (from.tabs.length > 1) {
      splitOff(tabId, directionEdge(direction), "keyboard");
    } else {
      announce(
        announcementText({
          action: "blocked",
          label: labelOf(tabId),
          position: sideWord(directionEdge(direction)),
        }),
      );
    }
  }

  /** @type {import("./types.js").DockContext["docking"]} */
  const docking = { docking: false };

  /** @type {import("./types.js").DockContext} */
  const context = {
    shared,
    docking,
    setActiveGroup,
    activate(tabId) {
      commit(
        activateTab(view, tabId),
        { type: "activate", source: "pointer", tabId },
        false,
      );
    },
    close(tabId) {
      const group = findTab(view, tabId);
      const next = closeTab(view, tabId);
      if (
        !commit(next, {
          type: "close",
          source: "pointer",
          tabId,
          groupId: group?.id,
        })
      ) {
        return false;
      }
      announce(announcementText({ action: "close", label: labelOf(tabId) }));
      // A group that collapses takes the focus with it.
      tick().then(() => {
        if (ref && !ref.contains(ref.ownerDocument.activeElement)) {
          focusGroup(resolvedActiveGroupId);
        }
      });
      return true;
    },
    reorder(groupId, tabId, index, source) {
      return commit(moveTab(view, tabId, groupId, index), {
        type: "move",
        source,
        tabId,
        groupId,
      });
    },
    resize(path, sizes) {
      commit(
        resizeLayout(view, path, sizes),
        { type: "resize", source: "pointer" },
        false,
      );
    },
  };
  setContext("carbon:DockLayout", context);

  /** @type {HTMLDivElement | null} */
  let refGhost = null;
  /** @type {HTMLDivElement | null} */
  let refPreview = null;
  /** @type {HTMLDivElement | null} */
  let refMarker = null;

  /**
   * @param {{ tabId: string; fromGroupId: string; groupId: string; position: import("../utils/dock-layout.js").DockPosition; index?: number }} drop
   */
  function handleDrop({ tabId, groupId, position, index }) {
    finishDock(
      tabId,
      "pointer",
      dockTab(view, tabId, groupId, position, index),
      position === "center" ? "move" : "split",
      groupId,
      position === "center" ? undefined : position,
    );
  }

  /** @param {{ tabId: string; fromGroupId: string; groupId: string; position: import("../utils/dock-layout.js").DockPosition }} drop */
  function canDock({ tabId, fromGroupId, groupId, position }) {
    if (fromGroupId !== groupId) return true;
    // Its own strip reorders, and its own body can only split off a tab
    // when another remains.
    const own = findTab(view, tabId);
    return position !== "center" && (own?.tabs.length ?? 0) > 1;
  }

  // The tab the menu was opened on.
  let menuTabId = "";
  /** The menu opens on this element, which `handleContextmenu` pokes. */
  /** @type {null | HTMLSpanElement} */
  let refMenuAnchor = null;

  /**
   * Open the menu of a tab. The menu is aimed at an anchor, since it would
   * open for the whole dock, and is sent a press like the one that opened
   * it: with no buttons down it opens from the keyboard, on its first item.
   * @param {HTMLElement} tab
   * @param {{ x: number; y: number } | null} point - Where a pointer pressed.
   */
  function openTabMenu(tab, point) {
    if (!refMenuAnchor) return;
    menuTabId = tab.id;
    const box = tab.getBoundingClientRect();
    refMenuAnchor.dispatchEvent(
      new MouseEvent("contextmenu", {
        cancelable: true,
        button: point ? 2 : 0,
        buttons: point ? 2 : 0,
        clientX: point ? point.x : rtl ? box.right : box.left,
        clientY: point ? point.y : box.bottom,
      }),
    );
  }

  /**
   * A right-click on a tab opens the tab's menu; anywhere else keeps the
   * browser's. A menu key press that the browser turns into this event, with
   * no button down, opens it from the keyboard.
   * @param {MouseEvent} event
   */
  function handleContextmenu(event) {
    const tab =
      event.target instanceof Element
        ? event.target.closest("[role='tab']")
        : null;
    if (!(tab instanceof HTMLElement)) return;
    event.preventDefault();
    const keyboard = event.button !== 2 && event.buttons === 0;
    openTabMenu(tab, keyboard ? null : { x: event.clientX, y: event.clientY });
  }

  $: menuGroup = menuTabId ? findTab(view, menuTabId) : undefined;
  $: menuOthers = allGroups.filter((group) => group.id !== menuGroup?.id);
  $: canSplit = (menuGroup?.tabs.length ?? 0) > 1;

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return;
    // F6 cycles the groups, as it does the landmarks of a page.
    const backward = matchesShortcut(event, "shift+f6");
    if (backward || matchesShortcut(event, "f6")) {
      if (allGroups.length < 2) return;
      event.preventDefault();
      const here = allGroups.findIndex(
        (group) => group.id === resolvedActiveGroupId,
      );
      const count = allGroups.length;
      const next = allGroups[(here + (backward ? -1 : 1) + count) % count];
      setActiveGroup(next.id);
      focusGroup(next.id);
      return;
    }
    const tab =
      event.target instanceof Element
        ? event.target.closest("[role='tab']")
        : null;
    if (!(tab instanceof HTMLElement)) return;
    const tabId = tab.id;
    // macOS has no menu key: Shift+F10 and the Menu key open it everywhere.
    if (matchesShortcut(event, "shift+f10") || event.key === "ContextMenu") {
      event.preventDefault();
      openTabMenu(tab, null);
      return;
    }
    if (matchesShortcut(event, "mod+\\")) {
      event.preventDefault();
      splitOff(tabId, "end", "keyboard");
      return;
    }
    /** @type {Record<string, import("../utils/dock-layout.js").DockDirection>} */
    const arrows = {
      arrowleft: rtl ? "end" : "start",
      arrowright: rtl ? "start" : "end",
      arrowup: "up",
      arrowdown: "down",
    };
    const key = event.key.toLowerCase();
    if (key in arrows && matchesShortcut(event, `alt+shift+${key}`)) {
      event.preventDefault();
      moveOrSplit(tabId, arrows[key]);
    }
  }

  /** @param {string} tabId */
  function toggleMaximize(tabId) {
    const group = findTab(view, tabId);
    if (!group) return;
    maximized = resolvedMaximized === group.id ? null : group.id;
    focusTab(tabId);
  }
</script>

<!-- A press or key inside the dock reaches its tabs and groups; the dock itself holds only the shortcuts. -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={ref}
  {id}
  role="group"
  class:bx--dock={true}
  class:bx--dock--maximized={resolvedMaximized !== null}
  use:dockDrag={{
    rtl: () => rtl,
    elements: () => ({
      ghost: refGhost,
      preview: refPreview,
      marker: refMarker,
    }),
    state: docking,
    canDock,
    onDrop: handleDrop,
  }}
  {...$$restProps}
  on:keydown={handleKeydown}
  on:contextmenu={handleContextmenu}
>
  <DockNode node={view}>
    <svelte:fragment slot="panel" let:document let:groupId>
      <slot name="panel" {document} {groupId} />
    </svelte:fragment>
    <svelte:fragment slot="empty"><slot name="empty" /></svelte:fragment>
  </DockNode>
  <div
    bind:this={refPreview}
    class:bx--dock__preview={true}
    aria-hidden="true"
  ></div>
  <div
    bind:this={refMarker}
    class:bx--dock__marker={true}
    aria-hidden="true"
  ></div>
  <div
    bind:this={refGhost}
    class:bx--dock__ghost={true}
    aria-hidden="true"
  ></div>
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{announcement}</span
  >
  <span
    bind:this={refMenuAnchor}
    class:bx--dock__anchor={true}
    aria-hidden="true"
  ></span>
  <ContextMenu
    target={refMenuAnchor ? [refMenuAnchor] : null}
    labelText={menu.label}
  >
    <ContextMenuOption
      id="{id}-split-right"
      labelText={menu.splitRight}
      shortcut="mod+\"
      disabled={!canSplit}
      on:click={() => splitOff(menuTabId, edgeOf("right"), "menu")}
    />
    <ContextMenuOption
      id="{id}-split-left"
      labelText={menu.splitLeft}
      disabled={!canSplit}
      on:click={() => splitOff(menuTabId, edgeOf("left"), "menu")}
    />
    <ContextMenuOption
      id="{id}-split-down"
      labelText={menu.splitDown}
      disabled={!canSplit}
      on:click={() => splitOff(menuTabId, edgeOf("down"), "menu")}
    />
    <ContextMenuOption
      id="{id}-split-up"
      labelText={menu.splitUp}
      disabled={!canSplit}
      on:click={() => splitOff(menuTabId, edgeOf("up"), "menu")}
    />
    <ContextMenuDivider />
    <ContextMenuOption
      id="{id}-move-to"
      labelText={menu.moveTo}
      disabled={menuOthers.length === 0}
    >
      {#each menuOthers as other (other.id)}
        <ContextMenuOption
          id="{id}-move-to-{other.id}"
          labelText={menu.moveToGroup({
            index: groupNumbers.get(other.id) ?? 0,
            label: documentsById[other.activeId ?? ""]?.label,
          })}
          on:click={() =>
            finishDock(
              menuTabId,
              "menu",
              moveTab(view, menuTabId, other.id),
              "move",
              other.id,
            )}
        />
      {/each}
    </ContextMenuOption>
    {#if allGroups.length > 1}
      <ContextMenuOption
        id="{id}-maximize"
        labelText={resolvedMaximized === menuGroup?.id
          ? menu.restore
          : menu.maximize}
        on:click={() => toggleMaximize(menuTabId)}
      />
    {/if}
    <ContextMenuDivider />
    <ContextMenuOption
      id="{id}-close"
      labelText={menu.close}
      kind="danger"
      on:click={() => context.close(menuTabId)}
    />
  </ContextMenu>
</div>
