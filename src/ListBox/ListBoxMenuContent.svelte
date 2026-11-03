<script>
  /**
   * Internal. The `listbox` root of a `ListBoxMenu`, shared by its in-place
   * and portal renders. It carries the transition directive only when the
   * menu animates, because Svelte 3 and 4 remove an element with any
   * transition one frame late.
   * @restProps {div}
   * @event {CustomEvent<null>} introstart
   * @event {CustomEvent<null>} introend
   * @event {CustomEvent<null>} outrostart
   * @event {CustomEvent<null>} outroend
   */

  /** @type {string} */
  export let id;

  /** @type {null | HTMLDivElement} */
  export let ref = null;

  /** @type {boolean} */
  export let alignEnd = false;

  /** @type {boolean} */
  export let wrapOptions = false;

  /**
   * The menu sits in a portal host that positions it, so it is not
   * positioned itself.
   * @type {boolean}
   */
  export let positionStatic = false;

  /** @type {boolean} */
  export let animated = false;

  /** @type {import("../motion/resolve-transition.js").TransitionFunction} */
  export let transitionFn;

  /** @type {object} */
  export let transitionParams = {};

  $: style = positionStatic
    ? `position: static; ${$$restProps.style || ""}`
    : $$restProps.style;

  // Svelte 5 makes an element inert while it leaves; Svelte 3 and 4 do not.
  // A leaving menu takes no clicks, and a close reversed mid-exit makes it
  // live again.
  /** @param {Event} event */
  function handleOutroStart(event) {
    /** @type {HTMLElement} */ (event.currentTarget).inert = true;
  }

  /** @param {Event} event */
  function handleIntroStart(event) {
    /** @type {HTMLElement} */ (event.currentTarget).inert = false;
  }
</script>

{#if animated}
  <div
    bind:this={ref}
    role="listbox"
    id="menu-{id}"
    class:bx--list-box__menu={true}
    class:bx--list-box__menu--align-end={alignEnd}
    class:bx--list-box__menu--wrap-options={wrapOptions}
    {...$$restProps}
    {style}
    transition:transitionFn|global={transitionParams}
    on:scroll
    on:mouseleave
    on:introstart
    on:introstart={handleIntroStart}
    on:introend
    on:outrostart
    on:outrostart={handleOutroStart}
    on:outroend
  >
    <slot />
  </div>
{:else}
  <div
    bind:this={ref}
    role="listbox"
    id="menu-{id}"
    class:bx--list-box__menu={true}
    class:bx--list-box__menu--align-end={alignEnd}
    class:bx--list-box__menu--wrap-options={wrapOptions}
    {...$$restProps}
    {style}
    on:scroll
    on:mouseleave
  >
    <slot />
  </div>
{/if}
