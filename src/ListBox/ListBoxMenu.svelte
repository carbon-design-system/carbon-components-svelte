<script>
  /**
   * @restProps {div}
   * @event {CustomEvent<null>} introstart
   * @event {CustomEvent<null>} introend
   * @event {CustomEvent<null>} outrostart
   * @event {CustomEvent<null>} outroend
   */

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Set to `true` to render the menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * @type {boolean}
   */
  export let portal = false;

  /**
   * Set to `true` to open the floating portal.
   * Only used when `portal` is `true`.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the anchor element to position the portal relative to.
   * Only used when `portal` is `true`.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Specify the direction of the menu.
   * Only used when `portal` is `true`.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify which edge of the field the menu lines up with when it is wider
   * than the field, as the inline `Dropdown` menu is. `"end"` opens the menu
   * toward the start side instead of past the field's end.
   * @type {"start" | "end"}
   */
  export let align = "start";

  /**
   * Class applied to a wrapper element inside the portal.
   * Only used when `portal` is `true`.
   * @type {string | undefined}
   */
  export let portalHostClass = undefined;

  /**
   * Set to `true` to let an option's label wrap onto as many lines as it
   * needs instead of being truncated with an ellipsis.
   * @type {boolean}
   */
  export let wrapOptions = false;

  /**
   * DOM id of the highlighted option (`{instanceId}-{item.id}`).
   * Applied as a two-node class change so `{#each}` does not re-run
   * every `ListBoxMenuItem` on ArrowDown.
   * @type {undefined | null | string}
   */
  export let highlightedId = undefined;

  /**
   * When `false`, skip scrolling the highlighted option into view
   * (pointer hover already has the item on screen).
   * @type {boolean}
   */
  export let highlightScroll = true;

  /**
   * Animate the menu as it opens and closes. Set to `true` for Carbon's
   * slide at `fast02` (a fade at `fast02` when `portal` is `true`), to
   * params (e.g., `{ duration: "moderate01" }`) to customize it, or to
   * `{ fn }` to use another transition. The menu does not animate by default.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").SlideParams>}
   */
  export let transition = undefined;

  import { setContext } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { fade, slide } from "../motion/transitions.js";
  import { uniqueId } from "../utils/unique-id.js";
  import ListBoxMenuContent from "./ListBoxMenuContent.svelte";
  import {
    createHighlightCursor,
    HIGHLIGHT_CURSOR_KEY,
  } from "./highlight-cursor.js";

  // Carbon's `.bx--list-box__menu` animates `max-height` at `fast02`. A portal
  // measures the menu to place it and to pick a side, so a menu that grows
  // from zero height would open below a field and jump above it once it no
  // longer fits, and one that opens upward would shrink away from its field.
  // In a portal the preset fades instead, which leaves the size alone.
  // The parent's `{#if open}` adds and removes the menu, so the directive is
  // global.
  /** @type {{ fn: import("../motion/resolve-transition.js").TransitionFunction; params: import("../motion/transitions.js").SlideParams }} */
  const slidePreset = { fn: slide, params: { duration: "fast02" } };
  /** @type {{ fn: import("../motion/resolve-transition.js").TransitionFunction; params: import("../motion/transitions.js").SlideParams }} */
  const fadePreset = { fn: fade, params: { duration: "fast02" } };

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, portal ? fadePreset : slidePreset));

  /** @type {ReturnType<typeof import("./highlight-cursor.js").createHighlightCursor>} */
  const highlightCursor = createHighlightCursor();
  setContext(HIGHLIGHT_CURSOR_KEY, highlightCursor);

  $: highlightCursor.set(highlightedId, { scroll: highlightScroll });
</script>

{#if portal}
  <FloatingPortal {anchor} {direction} {open}>
    <div
      class={portalHostClass}
      class:bx--list-box__menu-host--align-end={align === "end"}
    >
      <ListBoxMenuContent
        bind:ref
        {id}
        alignEnd={align === "end"}
        {wrapOptions}
        positionStatic
        {animated}
        {transitionFn}
        {transitionParams}
        {...$$restProps}
        on:scroll
        on:mouseleave
        on:introstart
        on:introend
        on:outrostart
        on:outroend
      >
        <slot />
      </ListBoxMenuContent>
    </div>
  </FloatingPortal>
{:else}
  <ListBoxMenuContent
    bind:ref
    {id}
    alignEnd={align === "end"}
    {wrapOptions}
    {animated}
    {transitionFn}
    {transitionParams}
    {...$$restProps}
    on:scroll
    on:mouseleave
    on:introstart
    on:introend
    on:outrostart
    on:outroend
  >
    <slot />
  </ListBoxMenuContent>
{/if}
