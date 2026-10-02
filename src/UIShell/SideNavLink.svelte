<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{}} badge
   */

  /** Set to `true` to select the current link */
  export let isSelected = false;

  /** Set to `true` to use the large variant */
  export let large = false;

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the text.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;

  import { resolveLinkRel } from "../utils/link-rel.js";
  import { overflowTitle } from "../utils/overflow-title.js";

  let textRef = null;
</script>

<li class:bx--side-nav__item={true} class:bx--side-nav__item--large={large}>
  <a
    bind:this={ref}
    aria-current={isSelected ? "page" : undefined}
    {href}
    rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
    class:bx--side-nav__link={true}
    class:bx--side-nav__link--current={isSelected}
    use:overflowTitle={{
      measure: textRef,
      lazy: true,
      title: $$restProps.title,
    }}
    {...$$restProps}
    on:click
  >
    {#if $$slots.icon || icon}
      <div
        class:bx--side-nav__icon={true}
        class:bx--side-nav__icon--small={true}
      >
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    <span bind:this={textRef} class:bx--side-nav__link-text={true}>
      <slot> {text} </slot>
    </span>
    {#if $$slots.badge}
      <div class:bx--side-nav__link-badge={true}><slot name="badge" /></div>
    {/if}
  </a>
</li>
