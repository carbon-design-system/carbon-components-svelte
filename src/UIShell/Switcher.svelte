<script>
  /**
   * @restProps {ul}
   * @slot {{}}
   */

  /**
   * Set to `true` when the switcher panel is visible.
   * Items are only tabbable while expanded; use the arrow keys to move
   * focus between them regardless.
   */
  export let expanded = true;

  /**
   * Obtain a reference to the HTML unordered list element.
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  /**
   * @type {import("svelte/store").Writable<Array<{ id: string; node?: HTMLElement }>>}
   */
  const items = writable([]);
  const expandedStore = writable(expanded);

  $: $expandedStore = expanded;

  // Items register from their own `onMount`, so their node is already in the
  // DOM; sort the registry by document position right then so arrow-key
  // navigation follows visual order even when items mount out of DOM order
  // (e.g., conditionally rendered).
  function sortByDomOrder(list) {
    return [...list].sort((a, b) => {
      if (!a.node || !b.node) return 0;
      const position = a.node.compareDocumentPosition(b.node);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }

  setContext("carbon:Switcher", {
    items,
    expanded: expandedStore,
    register: (item) => {
      items.update((current) =>
        current.some((entry) => entry.id === item.id)
          ? current
          : sortByDomOrder([...current, item]),
      );
    },
    unregister: (id) => {
      items.update((current) => current.filter((entry) => entry.id !== id));
    },
  });
</script>

<ul bind:this={ref} class:bx--switcher={true} {...$$restProps}>
  <slot />
</ul>
