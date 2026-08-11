<script>
  /**
   * @restProps {a}
   * @slot {{}}
   */

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` to mark this item as the currently selected one. */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get, readable } from "svelte/store";

  const switcherCtx = getContext("carbon:Switcher");
  const itemId = `cs-${Math.random().toString(36).slice(2)}`;
  const items = switcherCtx?.items ?? readable([]);
  const expanded = switcherCtx?.expanded ?? readable(true);

  if (switcherCtx) {
    // Register once mounted so the group can sort registrations into DOM
    // order via the element reference (mount order can differ from DOM
    // order when items are conditionally rendered).
    onMount(() => {
      switcherCtx.register({ id: itemId, node: ref });
      return () => switcherCtx.unregister(itemId);
    });
  }

  $: tabindex = $expanded ? 0 : -1;

  /**
   * @type {(event: KeyboardEvent) => void}
   */
  function handleKeydown(event) {
    if (!switcherCtx) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    const list = get(items);
    const currentIndex = list.findIndex((entry) => entry.id === itemId);
    if (currentIndex === -1 || list.length < 2) return;

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + list.length) % list.length;
    list[nextIndex]?.node?.focus();
  }
</script>

<li class:bx--switcher__item={true}>
  <a
    bind:this={ref}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    {tabindex}
    class:bx--switcher__item-link={true}
    class:bx--switcher__item-link--selected={isSelected}
    {...$$restProps}
    on:keydown={handleKeydown}
    on:keydown
    on:click
  >
    <slot />
  </a>
</li>
