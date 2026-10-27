<script>
  /**
   * @event {number} change
   */

  /**
   * Set the selected index of the switch item.
   * Ignored when `selectedId` is set.
   * An out-of-range value selects the nearest switch.
   * @bindable writable
   */
  export let selectedIndex = 0;

  /**
   * Specify the selected switch by id.
   * When set, takes precedence over `selectedIndex` and stays on the same
   * logical switch as switches are added or removed. Pair with a stable `id`
   * on each `Switch`.
   * @bindable writable
   * @type {string | undefined}
   */
  export let selectedId = undefined;

  /**
   * Specify the size of the content switcher.
   * Inherits the parent `InputGroup` size when unset. Also accepts Carbon
   * v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Choose whether or not to automatically change selection
   * on focus when using arrow keys. Defaults to "automatic".
   * @type {"automatic" | "manual"}
   */
  export let selectionMode = "automatic";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /**
   * Set to `true` to size each switch to its label instead of splitting the
   * width evenly. The switcher shrinks to fit its switches. Always on in an
   * `InputGroup`.
   */
  export let autoWidth = false;

  /**
   * Set to `true` when every switch sets `icon`, so the switcher fits its
   * switches from the first render, server-rendered markup included. The
   * switcher infers icon-only once its switches register, and that wins.
   */
  export let iconOnly = false;

  /**
   * Obtain a reference to the tablist HTML element.
   * @type {HTMLDivElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, get, readable, writable } from "svelte/store";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { clampIndex } from "../utils/clamp-index.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { createInitOrder } from "../utils/init-order.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { observeDomOrder } from "../utils/observe-dom-order.js";
  import { resolveIdSelection } from "../utils/resolve-id-selection.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { syncDomOrder } from "../utils/sync-dom-order.js";
  import { provideTooltipGroup } from "../utils/tooltip-group.js";

  // Beside a field in an InputGroup, the switcher takes the row's height
  // and is as wide as its switches.
  const inputGroup = getContext("carbon:InputGroup");
  const groupSize = inputGroup?.size ?? readable(undefined);
  $: effectiveSize = normalizeSize(size ?? $groupSize, FIELD_SIZE_ALIASES);

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  /**
   * @type {import("svelte/store").Writable<string | null>}
   */
  const currentId = writable(null);

  // Icon-only switches hand their tooltips off to each other, and to the
  // rest of an enclosing `TooltipGroup`.
  provideTooltipGroup();

  let prevIndex = -1;

  let committedIndex = -1;
  /**
   * Id of the switch rendered as selected, as of the last update. A removal
   * shifts `switches[committedIndex]` before afterUpdate can re-anchor.
   * @type {string | undefined}
   */
  let committedId;
  let focusedIndex = -1;
  /**
   * @type {import("svelte/store").Writable<Array<{ id: string; text: string; selected: boolean; icon: boolean; disabled: boolean }>>}
   */
  const sharedSwitches = writable([]);
  // Batch child registration. Leave afterUpdate's syncDomOrder unbatched
  // so DOM-order correction stays synchronous.
  //
  // Set needsDomSync inside the batched update. afterUpdate runs once
  // after mount before this flush, while switches is still [].
  const batchedSwitchesUpdate = batchStoreUpdates(sharedSwitches);
  $: switches = $sharedSwitches;

  /**
   * `SwitchPanel`s in DOM order. A panel pairs with the switch at the same
   * position.
   * @type {import("svelte/store").Writable<Array<{ id: string }>>}
   */
  const panels = writable([]);
  const batchedPanelsUpdate = batchStoreUpdates(panels);
  // Subscribe so a panel registering triggers afterUpdate's DOM-order sync.
  $: panelCount = $panels.length;
  let needsPanelSync = false;

  /**
   * Switch-panel pairing by position, in both directions.
   * @type {import("svelte/store").Readable<{ panelBySwitch: Record<string, string>; switchByPanel: Record<string, string> }>}
   */
  const pairs = derived([sharedSwitches, panels], ([list, panelList]) => {
    /** @type {Record<string, string>} */
    const panelBySwitch = {};
    /** @type {Record<string, string>} */
    const switchByPanel = {};
    const count = Math.min(list.length, panelList.length);
    for (let i = 0; i < count; i++) {
      panelBySwitch[list[i].id] = panelList[i].id;
      switchByPanel[panelList[i].id] = list[i].id;
    }
    return { panelBySwitch, switchByPanel };
  });

  // Inferred when every registered switch provides an `icon`. The switches
  // register after the switcher renders, never on the server, so until
  // then the `iconOnly` prop stands in.
  $: isIconOnly =
    switches.length > 0 ? switches.every((s) => s.icon) : iconOnly;

  $: if (selectedId !== undefined && switches) {
    syncSelection();
  }

  // Flag to trigger DOM reordering only when switches change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

  // Index mode: pull an out-of-range selectedIndex back into the list so one
  // switch stays selected and in the Tab order. syncSelection() does the same
  // for selectedId.
  $: if (
    selectedId === undefined &&
    switches.length > 0 &&
    (selectedIndex < 0 || selectedIndex >= switches.length)
  ) {
    selectedIndex = clampIndex(selectedIndex, 0, switches.length);
  }

  // The selected switch holds the tab stop unless it is disabled; then the
  // first enabled switch does, so the switcher stays reachable by keyboard.
  // Derived so it updates in the same flush as `currentId`.
  /** @type {import("svelte/store").Readable<string | null>} */
  const tabStopId = derived([sharedSwitches, currentId], ([list, id]) => {
    const current = list.find((s) => s.id === id);
    if (current && !current.disabled) return current.id;
    return list.find((s) => !s.disabled)?.id ?? null;
  });

  $: if (switches[committedIndex]) {
    if (prevIndex > -1 && prevIndex !== committedIndex) {
      dispatch("change", committedIndex);
    }
    prevIndex = committedIndex;
    currentId.set(switches[committedIndex].id);
  }

  /**
   * Switches claim their position here while they initialize, so the first
   * render already shows the selected switch. Otherwise it renders
   * unselected until registration flushes a microtask later, and any style
   * recalc in between fades its fill in on mount. Registration replaces the
   * claim once it flushes; for static children the two agree. Closed on
   * mount.
   * @type {ReturnType<typeof createInitOrder<string>>}
   */
  const initialSwitches = createInitOrder();
  let claimedBySelected = false;

  /**
   * @type {(id: string, selected: boolean) => void}
   */
  function claimSwitch(id, selected) {
    const index = initialSwitches.claim(id);
    if (index === undefined) return;
    if (selectedId !== undefined) {
      if (id === selectedId) currentId.set(id);
    } else if (selected) {
      // Matches registration: the last `selected` switch wins. On the
      // server, earlier switches have already rendered by then.
      claimedBySelected = true;
      currentId.set(id);
    } else if (!claimedBySelected && index === selectedIndex) {
      currentId.set(id);
    }
  }

  /**
   * @type {(data: { id: string; text: string; selected: boolean; icon: boolean; disabled: boolean }) => void}
   */
  function add({ id, text, selected, icon, disabled }) {
    claimSwitch(id, selected);
    batchedSwitchesUpdate((current) => {
      if (current.some((s) => s.id === id)) {
        return current;
      }

      if (selectedId === undefined && selected) {
        selectedIndex = current.length;
      }

      needsDomSync = true;
      return [...current, { id, text, selected, icon, disabled }];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function remove(id) {
    batchedSwitchesUpdate((current) => {
      needsDomSync = true;
      return current.filter((s) => s.id !== id);
    });
  }

  /**
   * @type {(id: string, disabled: boolean) => void}
   */
  function setDisabled(id, disabled) {
    batchedSwitchesUpdate((current) => {
      const index = current.findIndex((s) => s.id === id);
      if (index === -1 || current[index].disabled === disabled) return current;
      const next = [...current];
      next[index] = { ...current[index], disabled };
      return next;
    });
  }

  /**
   * @type {(id: string, icon: boolean) => void}
   */
  function setIcon(id, icon) {
    batchedSwitchesUpdate((current) => {
      const index = current.findIndex((s) => s.id === id);
      if (index === -1 || current[index].icon === icon) return current;
      const next = [...current];
      next[index] = { ...current[index], icon };
      return next;
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function addPanel(id) {
    batchedPanelsUpdate((current) => {
      if (current.some((p) => p.id === id)) return current;
      needsPanelSync = true;
      return [...current, { id }];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function removePanel(id) {
    batchedPanelsUpdate((current) => current.filter((p) => p.id !== id));
  }

  /**
   * @type {(id: string) => void}
   */
  function update(id) {
    if (selectedId !== undefined) {
      selectedId = id;
      return;
    }
    const index = switches.findIndex((s) => s.id === id);
    // Ignore a select that lands before this switch's batched registration flushes.
    if (index === -1) return;
    selectedIndex = index;
  }

  /**
   * Resolve `selectedIndex` from `selectedId` when set. If the selected id was
   * removed, keep the same index (next switch) or clamp, and re-anchor
   * `selectedId` to whatever switch that resolves to.
   * @type {() => void}
   */
  function syncSelection() {
    if (selectedId === undefined) return;

    const resolved = resolveIdSelection({
      items: switches,
      selectedId,
      currentIndex: selectedIndex,
    });
    if (!resolved) return;
    selectedIndex = resolved.index;
    selectedId = resolved.id;
  }

  /** @param {number} index */
  async function focusSwitchElement(index) {
    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  }

  /**
   * @type {(index: number) => Promise<void>}
   */
  async function changeTo(index) {
    if (index < 0 || index >= switches.length) return;

    if (selectedId === undefined) {
      selectedIndex = index;
    } else {
      const target = switches[index];
      if (!target) return;
      selectedId = target.id;
    }

    await focusSwitchElement(index);
  }

  /**
   * Move focus to a switch at an absolute index without changing selection.
   * @type {(index: number) => Promise<void>}
   */
  async function focusTo(index) {
    if (index < 0 || index >= switches.length) return;
    focusedIndex = index;

    await focusSwitchElement(index);
  }

  setContext("carbon:ContentSwitcher", {
    currentId,
    add,
    remove,
    update,
    setDisabled,
    setIcon,
    tabStopId,
    pairs,
    addPanel,
    removePanel,
  });

  onMount(() => {
    initialSwitches.close();
    // A keyed reorder moves switches without re-registering them. Resync in
    // afterUpdate, which keeps the selected switch selected.
    return observeDomOrder(ref, {
      selector: "[role='tab']",
      getItems: () => switches,
      onReorder: () => {
        needsDomSync = needsPanelSync = true;
        sharedSwitches.update((current) => [...current]);
      },
    });
  });

  afterUpdate(() => {
    // Sync the switches array with DOM order only when switches are
    // added, removed or reordered. The flag avoids infinite loops in Svelte 5 by not
    // running on every update. The selected switch is preserved by id so
    // selection survives reordering. Nested [role='tab'] elements inside
    // switch slots are dropped because their ids are not in the registry.
    if (needsDomSync && ref) {
      needsDomSync = false;

      // A selection requested in this flush (a `selected` Switch registering)
      // indexes the registry before the reorder. Otherwise keep the switch
      // that is rendered as selected; `switches[selectedIndex]` already points
      // past a removed switch.
      const preservedId =
        selectedIndex === committedIndex
          ? committedId
          : switches[selectedIndex]?.id;
      let next = switches;
      sharedSwitches.update((current) => {
        next = syncDomOrder({
          root: ref,
          selector: "[role='tab']",
          items: current,
        });
        return next;
      });

      if (preservedId !== undefined) {
        const nextIndex = next.findIndex((s) => s.id === preservedId);
        if (nextIndex > -1) {
          selectedIndex = nextIndex;
        }
      }
    }

    // Panels render after the tablist, so order them within its parent.
    // Tabpanels that are not registered here (e.g., from a nested Tabs) are
    // dropped by id.
    if (needsPanelSync && panelCount > 0 && ref?.parentElement) {
      needsPanelSync = false;
      const root = ref.parentElement;
      panels.update((current) =>
        syncDomOrder({
          root,
          selector: "[role='tabpanel']",
          items: current,
        }).map(({ id }) => ({ id })),
      );
    }

    // Commit only once switches have registered. Committing the initial index
    // against an empty list would make a mount-time `selected` Switch look
    // like a change.
    if (switches.length > 0 && selectedIndex !== committedIndex) {
      committedIndex = selectedIndex;
      focusedIndex = -1;
    }
    committedId = switches[committedIndex]?.id;
  });
</script>

<div
  bind:this={ref}
  role="tablist"
  use:rovingFocus={{
    selector: "[role='tab']",
    rtl: () => resolveLayoutDirection($layoutDirection, ref) === "rtl",
    skipDisabled: true,
    getItems: () =>
      switches
        .map((s) => document.getElementById(s.id))
        .filter((node) => node instanceof HTMLElement),
    getActiveIndex: () => {
      // Move from the switch that holds focus. Fall back to the manual-mode
      // focus index, then the selection, when focus is elsewhere.
      const active = switches.findIndex(
        (s) => s.id === document.activeElement?.id,
      );
      if (active >= 0) return active;
      if (focusedIndex >= 0) return focusedIndex;
      // Start from the fallback tab stop when the selected switch is disabled,
      // so the first arrow press moves off it instead of re-selecting it.
      if (switches[committedIndex]?.disabled) {
        const index = switches.findIndex((s) => s.id === get(tabStopId));
        if (index > -1) return index;
      }
      return committedIndex;
    },
    onMove: (index, event) => {
      if (hasModifierKey(event)) return;
      // Prevent the arrow keys from also scrolling the page.
      event.preventDefault();
      if (selectionMode === "manual") {
        focusTo(index);
      } else {
        changeTo(index);
      }
    },
  }}
  class:bx--content-switcher={true}
  class:bx--content-switcher--xs={effectiveSize === "xs"}
  class:bx--content-switcher--sm={effectiveSize === "sm"}
  class:bx--content-switcher--xl={effectiveSize === "xl"}
  class:bx--content-switcher--icon-only={isIconOnly}
  class:bx--content-switcher--low-contrast={lowContrast}
  class:bx--content-switcher--auto-width={autoWidth || !!inputGroup}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
>
  <slot />
</div>
<slot name="content" />
