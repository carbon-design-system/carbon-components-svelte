<script>
  /**
   * @typedef {0 | 1 | 2} LayerLevel
   * @slot {{ level: LayerLevel; }}
   */

  /**
   * Layer puts its content on the next Carbon surface. It re-points the
   * contextual tokens (`layer`, `field`, `border-subtle`, …) so fields,
   * tiles, and borders inside it contrast with the surface below.
   * Nested layers step up one level each, up to three.
   *
   * @example
   * ```svelte
   * <Layer>
   *   <TextInput labelText="On layer 2" />
   *   <Layer>
   *     <TextInput labelText="On layer 3" />
   *   </Layer>
   * </Layer>
   * ```
   */

  /**
   * Set the layer level: `0` is the page surface, `2` the highest. By
   * default a layer sits one level above its parent `Layer`, so a
   * top-level layer is level 1.
   * @type {LayerLevel | undefined}
   */
  export let level = undefined;

  /** Set to `true` to paint the layer's background */
  export let withBackground = false;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  import { getContext, setContext } from "svelte";
  import { readable, readonly, writable } from "svelte/store";
  import { LAYER_CONTEXT_KEY } from "../constants/context-keys.js";

  const LEVELS = ["one", "two", "three"];

  /** @type {import("svelte/store").Readable<LayerLevel>} */
  const parentLevel = getContext(LAYER_CONTEXT_KEY) ?? readable(1);

  /** @type {import("svelte/store").Writable<LayerLevel>} */
  const childLevel = writable(1);

  /** @type {LayerLevel} */
  $: current = level ?? $parentLevel;
  $: childLevel.set(
    /** @type {LayerLevel} */ (Math.max(0, Math.min(current + 1, 2))),
  );

  setContext(LAYER_CONTEXT_KEY, readonly(childLevel));

  $: layerClass = [
    `bx--layer-${LEVELS[current]}`,
    withBackground && "bx--layer__with-background",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element this={tag} {...$$restProps} class={layerClass}>
  <slot level={current} />
</svelte:element>
