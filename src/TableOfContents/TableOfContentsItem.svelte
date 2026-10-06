<script context="module">
  /** Deepest `level`: `h2` through `h4` on a page whose title is the `h1`. */
  const MAX_LEVEL = 3;

  /**
   * The section id a link points to on the current page, such as
   * `"#overview"` or `"/docs#overview"` on `/docs`, or `undefined` for any
   * other link. Links with a path resolve only in the browser.
   * @param {string | undefined} href
   */
  function hashTarget(href) {
    let hash = href;
    if (!href?.startsWith("#")) {
      if (!href || typeof window === "undefined") return undefined;
      /** @type {URL} */
      let url;
      try {
        url = new URL(href, document.baseURI);
      } catch {
        return undefined;
      }
      const { origin, pathname, search } = window.location;
      if (
        url.origin !== origin ||
        url.pathname !== pathname ||
        url.search !== search
      ) {
        return undefined;
      }
      hash = url.hash;
    }
    if (!hash || hash.length === 1) return undefined;
    try {
      return decodeURIComponent(hash.slice(1));
    } catch {
      return hash.slice(1);
    }
  }
</script>

<script>
  /**
   * @restProps {a}
   */

  /**
   * Specify the link to the section, such as `"#overview"`.
   * The part after `#` is the id of the section element. A link with a path
   * to the current page, such as `"/docs#overview"`, also works.
   * @type {string}
   */
  export let href;

  /**
   * Specify the item text.
   * Alternatively, use the default slot.
   */
  export let text = "";

  /**
   * Specify the heading level of the section, from 1 to 3, such as an `h3`
   * listed under the `h2` before it. Each level below the first indents one
   * more step. Other values are clamped to that range.
   * @type {1 | 2 | 3}
   */
  export let level = 1;

  /**
   * Obtain a reference to the anchor HTML element.
   * @type {null | HTMLAnchorElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";

  const ctx = getContext("carbon:TableOfContents");
  const selectedId = ctx.selectedId;

  /** @type {null | HTMLLIElement} */
  let node = null;
  /** @type {undefined | (() => void)} */
  let unregister;

  $: id = hashTarget(href);
  $: depth = Math.min(Math.max(Math.trunc(level) || 1, 1), MAX_LEVEL);
  $: active = id !== undefined && $selectedId === id;

  /**
   * @param {null | HTMLLIElement} node
   * @param {string | undefined} id
   */
  function syncRegistration(node, id) {
    unregister?.();
    unregister = node && id ? ctx.register({ id, node }) : undefined;
  }

  $: syncRegistration(node, id);

  onMount(() => () => unregister?.());

  /** @param {MouseEvent} event */
  function handleClick(event) {
    // Leave modified clicks (new tab or window) alone. A cancelled click
    // still selects: client-side routers cancel hash links and scroll to the
    // target themselves.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      id === undefined
    ) {
      return;
    }
    ctx.select(id, event);
  }
</script>

<li
  bind:this={node}
  class:bx--toc__item={true}
  class:bx--toc__item--active={active}
  class:bx--toc__item--nested={depth > 1}
  style:--ccs-toc-level={depth > 1 ? depth : undefined}
>
  <a
    bind:this={ref}
    {href}
    aria-current={active ? "location" : undefined}
    class:bx--toc__link={true}
    {...$$restProps}
    on:click
    on:click={handleClick}
  >
    <slot>{text}</slot>
  </a>
</li>
