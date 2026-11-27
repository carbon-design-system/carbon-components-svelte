<script>
  /**
   * @restProps {a}
   * @slot {{}}
   */

  /**
   * Specify the id this item selects. It becomes the value of the URL
   * parameter and of `selectedId`.
   */
  export let id = "";

  /**
   * Specify the link to the item. Defaults to the current page with the
   * selection parameter set, so the link can be opened or copied on its own.
   * @type {string | undefined}
   */
  export let href = undefined;

  import { getContext } from "svelte";
  import ContainedListItem from "../ContainedList/ContainedListItem.svelte";

  /**
   * @type {undefined | {
   *   selected: import("svelte/store").Readable<string>;
   *   hrefFor: import("svelte/store").Readable<(id: string) => string>;
   *   select: (id: string) => void;
   * }}
   */
  const layout = getContext("carbon:ListDetailLayout");
  const selected = layout?.selected;
  const hrefFor = layout?.hrefFor;

  // A plain click selects in place. A modified click, or a middle click,
  // keeps the browser's own link behavior: a new tab or window.
  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    if (!layout) return;
    event.preventDefault();
    layout.select(id);
  }
</script>

<ContainedListItem
  href={id
    ? (href ?? ($hrefFor ? $hrefFor(id) : `?id=${encodeURIComponent(id)}`))
    : href}
  selected={id !== "" && $selected === id}
  data-list-detail-id={id}
  {...$$restProps}
  on:click
  on:click={handleClick}
>
  <slot />
</ContainedListItem>
