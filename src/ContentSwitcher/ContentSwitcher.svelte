<script>
  /**
   * @event {number} change
   */

  /**
   * Set the selected index of the switch item.
   * @bindable writable
   */
  export let selectedIndex = 0;

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

  let prevIndex = -1;

  let currentIndex = -1;
  let focusedIndex = -1;
  let switches = [];

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
   * @type {(data: { id: string; text: string; selected: boolean }) => void}
   */
  const add = ({ id, text, selected }) => {
    if (switches.some((s) => s.id === id)) {
      return;
    }

    if (selected) {
      selectedIndex = switches.length;
    }

    needsDomSync = true;
    switches = [...switches, { id, text, selected }];
  };

  /**
   * @type {(id: string) => void}
   */
  const remove = (id) => {
    needsDomSync = true;
    switches = switches.filter((s) => s.id !== id);
  };

  /**
   * @type {(id: string) => void}
   */
  const update = (id) => {
    selectedIndex = switches.map(({ id }) => id).indexOf(id);
  };

  /**
   * @type {(index: number) => Promise<void>}
   */
  const changeTo = async (index) => {
    if (index < 0 || index >= switches.length) return;
    selectedIndex = index;

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  };

  /**
   * Move focus to a switch at an absolute index without changing selection.
   * @type {(index: number) => Promise<void>}
   */
  const focusTo = async (index) => {
    if (index < 0 || index >= switches.length) return;
    focusedIndex = index;

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  };

  setContext("carbon:ContentSwitcher", {
    currentId,
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

      const selectedId = switches[selectedIndex]?.id;
      switches = syncDomOrder({
        root: ref,
        selector: "[role='tab']",
        items: switches,
      });

      if (selectedId !== undefined) {
        const nextIndex = switches.findIndex((s) => s.id === selectedId);
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
    onMove: (index) =>
      selectionMode === "manual" ? focusTo(index) : changeTo(index),
  }}
  class:bx--content-switcher={true}
  class:bx--content-switcher--sm={size === "sm"}
  class:bx--content-switcher--xl={size === "xl"}
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
