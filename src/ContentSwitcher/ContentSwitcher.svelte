<script>
  /**
   * @event {number} change
   */

  /**
   * Set the selected index of the switch item.
   * Ignored when `selectedId` is set.
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
  import { writable } from "svelte/store";
  import { rovingFocus } from "../utils/rovingFocus.js";
  import { syncDomOrder } from "../utils/syncDomOrder.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<string | null>}
   */
  const currentId = writable(null);

  // Tracks which switch's tooltip is open so only one shows at a time.
  // Scoped per content switcher instance.
  const activeTooltip = writable(null);

  let prevIndex = -1;

  let currentIndex = -1;
  let focusedIndex = -1;
  let switches = [];

  // Inferred when every registered switch provides an `icon`.
  $: iconOnly = switches.length > 0 && switches.every((s) => s.icon);

  $: if (selectedId !== undefined && switches) {
    syncSelection();
  }

  // Flag to trigger DOM reordering only when switches change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;
  $: if (switches[currentIndex]) {
    if (prevIndex > -1 && prevIndex !== currentIndex) {
      dispatch("change", currentIndex);
    }
    prevIndex = currentIndex;
    currentId.set(switches[currentIndex].id);
  }

  /**
   * @type {(data: { id: string; text: string; selected: boolean; icon: boolean }) => void}
   */
  function add({ id, text, selected, icon }) {
    if (switches.some((s) => s.id === id)) {
      return;
    }

    if (selectedId === undefined && selected) {
      selectedIndex = switches.length;
    }

    needsDomSync = true;
    switches = [...switches, { id, text, selected, icon }];
  }

  /**
   * @type {(id: string) => void}
   */
  function remove(id) {
    needsDomSync = true;
    switches = switches.filter((s) => s.id !== id);
  }

  /**
   * @type {(id: string) => void}
   */
  function update(id) {
    if (selectedId !== undefined) {
      selectedId = id;
      return;
    }
    selectedIndex = switches.map(({ id }) => id).indexOf(id);
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

    selectedIndex = Math.min(Math.max(selectedIndex, 0), switches.length - 1);
    selectedId = switches[selectedIndex]?.id;
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

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  }

  /**
   * Move focus to a switch at an absolute index without changing selection.
   * @type {(index: number) => Promise<void>}
   */
  async function focusTo(index) {
    if (index < 0 || index >= switches.length) return;
    focusedIndex = index;

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  }

  setContext("carbon:ContentSwitcher", {
    currentId,
    activeTooltip,
    add,
    remove,
    update,
  });

  afterUpdate(() => {
    // Sync the switches array with DOM order only when switches are
    // added/removed. The flag avoids infinite loops in Svelte 5 by not
    // running on every update. The selected switch is preserved by id so
    // selection survives reordering. Nested [role='tab'] elements inside
    // switch slots are dropped because their ids are not in the registry.
    if (needsDomSync && ref) {
      needsDomSync = false;

      const preservedId = switches[selectedIndex]?.id;
      switches = syncDomOrder({
        root: ref,
        selector: "[role='tab']",
        items: switches,
      });

      if (preservedId !== undefined) {
        const nextIndex = switches.findIndex((s) => s.id === preservedId);
        if (nextIndex > -1) {
          selectedIndex = nextIndex;
        }
      }
    }

    if (selectedIndex !== currentIndex) {
      currentIndex = selectedIndex;
      focusedIndex = -1;
    }
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-interactive-supports-focus -->
<div
  bind:this={ref}
  role="tablist"
  use:rovingFocus={{
    selector: "[role='tab']",
    skipDisabled: true,
    getItems: () =>
      switches
        .map((s) => document.getElementById(s.id))
        .filter((el) => el instanceof HTMLElement),
    getActiveIndex: () => (focusedIndex >= 0 ? focusedIndex : currentIndex),
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
