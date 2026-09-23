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
   * @type {"sm" | "xl"}
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
   * Obtain a reference to the tablist HTML element.
   * @type {HTMLDivElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, setContext, tick } from "svelte";
  import { derived, get, writable } from "svelte/store";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { clampIndex } from "../utils/clamp-index.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { syncDomOrder } from "../utils/sync-dom-order.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<string | null>}
   */
  const currentId = writable(null);

  // Tracks which switch's tooltip is open so only one shows at a time.
  // Scoped per content switcher instance.
  const activeTooltip = writable(null);

  let prevIndex = -1;

  let committedIndex = -1;
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

  // Inferred when every registered switch provides an `icon`.
  $: iconOnly = switches.length > 0 && switches.every((s) => s.icon);

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
   * @type {(data: { id: string; text: string; selected: boolean; icon: boolean; disabled: boolean }) => void}
   */
  function add({ id, text, selected, icon, disabled }) {
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

    const index = switches.findIndex((s) => s.id === selectedId);
    if (index > -1) {
      selectedIndex = index;
      return;
    }

    if (switches.length === 0) return;

    selectedIndex = clampIndex(selectedIndex, 0, switches.length);
    selectedId = switches[selectedIndex]?.id;
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
    activeTooltip,
    add,
    remove,
    update,
    setDisabled,
    tabStopId,
  });

  afterUpdate(() => {
    // Sync the switches array with DOM order only when switches are
    // added/removed. The flag avoids infinite loops in Svelte 5 by not
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
          ? get(currentId)
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

    // Commit only once switches have registered. Committing the initial index
    // against an empty list would make a mount-time `selected` Switch look
    // like a change.
    if (switches.length > 0 && selectedIndex !== committedIndex) {
      committedIndex = selectedIndex;
      focusedIndex = -1;
    }
  });
</script>

<div
  bind:this={ref}
  role="tablist"
  use:rovingFocus={{
    selector: "[role='tab']",
    skipDisabled: true,
    getItems: () =>
      switches
        .map((s) => document.getElementById(s.id))
        .filter((node) => node instanceof HTMLElement),
    getActiveIndex: () => {
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
  class:bx--content-switcher--sm={size === "sm"}
  class:bx--content-switcher--xl={size === "xl"}
  class:bx--content-switcher--icon-only={iconOnly}
  class:bx--content-switcher--low-contrast={lowContrast}
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
