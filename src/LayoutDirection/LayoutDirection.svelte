<script>
  /**
   * @template {keyof HTMLElementTagNameMap} [Tag="div"]
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * LayoutDirection sets the writing direction for part of a page. It
   * renders an element with `dir`, and components inside it read the
   * direction from context. Nest one to switch back, such as an LTR code
   * block in an RTL page.
   *
   * Content that a component portals out of the subtree, such as a
   * `portalMenu` or a tooltip, keeps the direction.
   *
   * @example
   * ```svelte
   * <LayoutDirection dir="rtl">
   *   <TextInput labelText="الاسم" />
   * </LayoutDirection>
   * ```
   */

  /**
   * Specify the layout direction of the content.
   * @type {"ltr" | "rtl"}
   */
  export let dir;

  /**
   * Specify the tag name.
   * @type {Tag}
   */
  export let tag = "div";

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import { LAYOUT_DIRECTION_CONTEXT_KEY } from "../constants/context-keys.js";

  const direction = writable(dir);

  $: direction.set(dir);

  setContext(LAYOUT_DIRECTION_CONTEXT_KEY, readonly(direction));
</script>

<svelte:element this={tag} bind:this={ref} {...$$restProps} {dir}>
  <slot />
</svelte:element>
