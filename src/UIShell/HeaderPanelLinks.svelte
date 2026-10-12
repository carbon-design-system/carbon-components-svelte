<script>
  import { setContext } from "svelte";
  import { get } from "svelte/store";
  import { createDomNodeRegistry } from "../utils/dom-node-registry.js";

  const linkRegistry = createDomNodeRegistry();
  /** @type {(node: HTMLElement) => void} */
  const registerLink = linkRegistry.register;
  /** @type {(node: HTMLElement) => void} */
  const unregisterLink = linkRegistry.unregister;

  // Registration follows mount order, which differs from DOM order when
  // links are inserted later; sort so arrow keys follow what is on screen.
  /** @type {() => ReadonlyArray<HTMLElement>} */
  const getLinks = () => {
    linkRegistry.flush();
    return [...get(linkRegistry.items)].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  };

  setContext("carbon:HeaderPanelLinks", {
    registerLink,
    unregisterLink,
    getLinks,
  });
</script>

<ul class:bx--switcher__item={true}>
  <slot />
</ul>
