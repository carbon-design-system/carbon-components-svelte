<script>
  /**
   * Set an id for the panel element.
   * Prefer a stable value when switches are added or removed.
   */
  export let id = uniqueId();

  /**
   * Set to `true` to defer mounting panel content until its switch is first selected
   */
  export let lazy = false;

  /**
   * Set to `true` to unmount panel content when its switch is deselected
   */
  export let unmountOnHide = false;

  /**
   * Obtain a reference to the panel HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const { currentId, pairs, addPanel, claimPanel, removePanel } = getContext(
    "carbon:ContentSwitcher",
  );

  // The switch at this panel's position, known while the panel initializes.
  // Registration flushes after the first render (never on the server), so
  // until it pairs the panel, this keeps the selected panel visible.
  const claimedSwitchId = claimPanel(id);

  addPanel(id);

  onMount(() => {
    return () => {
      removePanel(id);
    };
  });

  let selectedOnce = false;

  // Paired by position with the switch at the same index.
  let paired = false;
  $: if ($pairs.switchByPanel[id] !== undefined) paired = true;
  $: switchId =
    $pairs.switchByPanel[id] ?? (paired ? undefined : claimedSwitchId);
  $: selected = switchId !== undefined && $currentId === switchId;
  $: if (selected) selectedOnce = true;
  $: shouldMount = unmountOnHide ? selected : lazy ? selectedOnce : true;
</script>

<div
  bind:this={ref}
  role="tabpanel"
  tabindex="0"
  aria-labelledby={$$restProps["aria-label"] ? undefined : switchId}
  hidden={selected ? undefined : ""}
  {id}
  {...$$restProps}
>
  {#if shouldMount}
    <slot />
  {/if}
</div>
