<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Specify the `href` attribute to render an anchor.
   * Omit it to render a button (for actions that do not navigate).
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the label text.
   * Alternatively, use the default slot.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify an icon to render after the label.
   * Alternatively, use the "icon" slot.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set to `true` to mark the link as the current selection */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML element (anchor or button).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { moveIndex } from "../utils/move-index.js";

  const ctx = getContext("carbon:HeaderPanelLinks");
  const panel = getContext("carbon:HeaderAction");

  // Runs after the forwarded `click` handler so it can opt out with
  // `event.preventDefault()`.
  function handleClick(event) {
    if (!event.defaultPrevented) panel?.select();
  }

  onMount(() => {
    const node = ref;
    if (ctx && node) ctx.registerLink(node);
    return () => {
      if (ctx && node) ctx.unregisterLink(node);
    };
  });

  // Mirrors Carbon React's `Switcher`: arrows wrap, Home/End jump to the ends.
  function handleKeydown(event) {
    if (!ctx || event.defaultPrevented) return;

    const links = ctx.getLinks().filter((link) => !link.disabled);
    const currentIndex = links.indexOf(ref);
    if (currentIndex === -1) return;

    let next;
    if (event.key === "ArrowDown") {
      next = links[moveIndex(currentIndex, 1, links.length)];
    } else if (event.key === "ArrowUp") {
      next = links[moveIndex(currentIndex, -1, links.length)];
    } else if (event.key === "Home") {
      next = links[0];
    } else if (event.key === "End") {
      next = links[links.length - 1];
    } else {
      return;
    }

    event.preventDefault();
    next?.focus();
  }
</script>

<li class:bx--switcher__item={true}>
  {#if href}
    <a
      bind:this={ref}
      {href}
      rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
      aria-current={isSelected ? "page" : undefined}
      class:bx--switcher__item-link={true}
      class:bx--switcher__item-link--selected={isSelected}
      {...$$restProps}
      on:click
      on:click={handleClick}
      on:keydown
      on:keydown={handleKeydown}
    >
      <span class:bx--switcher__item-text={true}><slot>{text}</slot></span>
      {#if icon || $$slots.icon}
        <span class:bx--switcher__item-icon={true}>
          <slot name="icon"><svelte:component this={icon} size={16} /></slot>
        </span>
      {/if}
    </a>
  {:else}
    <button
      bind:this={ref}
      type="button"
      aria-current={isSelected ? "page" : undefined}
      class:bx--switcher__item-link={true}
      class:bx--switcher__item-link--selected={isSelected}
      {...$$restProps}
      on:click
      on:click={handleClick}
      on:keydown
      on:keydown={handleKeydown}
    >
      <span class:bx--switcher__item-text={true}><slot>{text}</slot></span>
      {#if icon || $$slots.icon}
        <span class:bx--switcher__item-icon={true}>
          <slot name="icon"><svelte:component this={icon} size={16} /></slot>
        </span>
      {/if}
    </button>
  {/if}
</li>
