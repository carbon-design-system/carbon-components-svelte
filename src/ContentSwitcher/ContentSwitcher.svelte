<script>
  /**
   * @event {number} change
   */

  /** Set the selected index of the switch item */
  export let selectedIndex = 0;

  /**
   * Specify the size of the content switcher
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<string | null>}
   */
  const currentId = writable(null);

  $: currentIndex = -1;
  $: switches = [];
  $: if (switches[currentIndex]) {
    dispatch("change", currentIndex);
    currentId.set(switches[currentIndex].id);
  }

  /**
   * @type {(data: { id: string; text: string; selected: boolean }) => void}
   */
  const add = ({ id, text, selected }) => {
    if (selected) {
      selectedIndex = switches.length;
    }

    switches = [...switches, { id, text, selected }];
  };

  /**
   * @type {(id: string) => void}
   */
  const update = (id) => {
    selectedIndex = switches.map(({ id }) => id).indexOf(id);
  };

  /**
   * @type {(direction: number) => void}
   */
  const change = (direction) => {
    let index = currentIndex + direction;

    if (index < 0) {
      index = switches.length - 1;
    } else if (index >= switches.length) {
      index = 0;
    }

    selectedIndex = index;
  };

  setContext("ContentSwitcher", {
    currentId,
    add,
    update,
    change,
  });

  afterUpdate(() => {
    if (selectedIndex !== currentIndex) {
      currentIndex = selectedIndex;
    }
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-interactive-supports-focus -->
<div
  role="tablist"
  class:bx--content-switcher={true}
  class:bx--content-switcher--sm={size === "sm"}
  class:bx--content-switcher--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
