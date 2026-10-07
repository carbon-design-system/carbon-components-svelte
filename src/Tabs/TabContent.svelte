<script>
  /**
   * Set an id for the top-level element.
   * Without one, the panel takes `{tabId}-panel` from the tab at its position.
   * Prefer a stable value when pairing panels with dynamic tabs.
   */
  export let id = uniqueId();

  /**
   * Set to `true` to defer mounting panel content until this tab is first selected
   */
  export let lazy = false;

  /**
   * Set to `true` to unmount panel content when the tab is deselected
   */
  export let unmountOnHide = false;

  /**
   * Set to `true` to remove the panel's horizontal padding so its content
   * lines up with the tab list's leading edge
   */
  export let flush = false;

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const {
    selectedContent,
    addContent,
    removeContent,
    claimPanel,
    tabs,
    contentById,
  } = getContext("carbon:Tabs");

  // Claim this panel's position before it renders; see `claimPanel` in
  // `Tabs`. Without its own `id`, the panel takes the id its tab already
  // points `aria-controls` at. With its own `id`, it keeps it: the tab
  // rendered first, so on the server its `aria-controls` still names the
  // reserved id until registration corrects it after mount.
  const initialPanel = claimPanel?.(id, $$props.id !== undefined);
  if (initialPanel && initialPanel.id !== id) id = initialPanel.id;

  addContent({ id });

  onMount(() => {
    return () => {
      removeContent(id);
    };
  });

  let selectedOnce = false;

  $: selected = $selectedContent === id;
  $: if (selected) selectedOnce = true;
  $: index = $contentById[id]?.index;
  // Before registration flushes, use the tab that claimed the same position.
  $: tabId = index === undefined ? initialPanel?.tabId : $tabs[index]?.id;
  $: shouldMount = unmountOnHide ? selected : lazy ? selectedOnce : true;
  // `true`, not `""`: Svelte 3/4 server rendering drops a falsy boolean
  // attribute, and their client would write `hidden="false"` for `false`.
  $: hidden = selected ? undefined : true;
</script>

<div
  role="tabpanel"
  aria-labelledby={tabId}
  aria-hidden={!selected}
  {hidden}
  {id}
  class:bx--tab-content={true}
  class:bx--tab-content--flush={flush}
  {...$$restProps}
>
  {#if shouldMount}
    <slot />
  {/if}
</div>
