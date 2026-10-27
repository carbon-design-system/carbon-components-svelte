// @ts-check

/**
 * Turn a component's `transition` prop into the function and params for a
 * `transition:` directive, and whether to render the directive at all.
 *
 * `undefined` and `false` are off. `true` is the component's preset. An object
 * overrides the preset's params, and its `fn` swaps in any Svelte transition,
 * which then uses its own defaults, since a preset's params (such as `fly`'s
 * `x`) mean nothing to another function.
 *
 * A component renders the directive only when `animated`, in a separate branch
 * of the `{#if}`. Svelte 3 and 4 remove an element that carries `transition:`
 * one frame late even at zero duration, so a prop that is off must leave the
 * directive out.
 * @template {object} P
 * @param {import("./resolve-transition.js").TransitionProp<P>} prop
 * @param {{ fn: import("./resolve-transition.js").TransitionFunction; params?: P }} preset
 * @returns {{ fn: import("./resolve-transition.js").TransitionFunction; params: P; animated: boolean }}
 */
export function resolveTransition(prop, preset) {
  if (!prop) {
    return { fn: preset.fn, params: /** @type {P} */ ({}), animated: false };
  }

  if (prop === true) {
    return {
      fn: preset.fn,
      params: preset.params ?? /** @type {P} */ ({}),
      animated: true,
    };
  }

  const { fn, ...params } =
    /** @type {{ fn?: import("./resolve-transition.js").TransitionFunction }} */ (
      prop
    );
  if (fn && fn !== preset.fn) {
    return { fn, params: /** @type {P} */ (params), animated: true };
  }
  return {
    fn: preset.fn,
    params: /** @type {P} */ ({ ...preset.params, ...params }),
    animated: true,
  };
}
