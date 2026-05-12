<script>
  /**
   * @event {number} change
   */

  /** Set the selected index of the switch item */
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
   */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, setContext, tick } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<string | null>}
   */
  const currentId = writable(null);

  let prevIndex = -1;

  let currentIndex = -1;
  let focusedIndex = -1;
  let switches = [];
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

    switches = [...switches, { id, text, selected }];
  };

  /**
   * @type {(id: string) => void}
   */
  const remove = (id) => {
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
    selectedIndex = index;

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  };

  /**
   * @type {(direction: number) => Promise<void>}
   */
  const change = async (direction) => {
    let index = currentIndex + direction;

    if (index < 0) {
      index = switches.length - 1;
    } else if (index >= switches.length) {
      index = 0;
    }

    await changeTo(index);
  };

  /**
   * Move focus to a switch at an absolute index without changing selection.
   * @type {(index: number) => Promise<void>}
   */
  const focusTo = async (index) => {
    focusedIndex = index;

    await tick();
    const tab = document.getElementById(switches[index].id);

    if (tab instanceof HTMLElement) {
      tab.focus();
    }
  };

  /**
   * Move focus to the next/previous switch without changing selection.
   * @type {(direction: number) => Promise<void>}
   */
  const focus = async (direction) => {
    const base = focusedIndex >= 0 ? focusedIndex : currentIndex;
    let index = base + direction;

    if (index < 0) {
      index = switches.length - 1;
    } else if (index >= switches.length) {
      index = 0;
    }

    await focusTo(index);
  };

  setContext("carbon:ContentSwitcher", {
    currentId,
    add,
    remove,
    update,
    change,
    changeTo,
    focus,
    focusTo,
    get switchCount() {
      return switches.length;
    },
    get selectionMode() {
      return selectionMode;
    },
  });

  afterUpdate(() => {
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
