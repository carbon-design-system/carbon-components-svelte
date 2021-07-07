<script>
  /**
   * @typedef {"sm" | "md" | "lg" | "xlg" | "max"} BreakpointSize
   * @typedef {320 | 672 | 1056 | 1312 | 1584} BreakpointValue
   * @event {{ size: BreakpointSize; breakpointValue: BreakpointValue; }} match
   */

  /** @type {BreakpointSize} */
  export let size = undefined;

  /** @type {Record<BreakpointSize, boolean>} */
  export let sizes = {
    sm: false,
    md: false,
    lg: false,
    xlg: false,
    max: false,
  };

  /** @type {Record<BreakpointSize, BreakpointValue>} */
  export const breakpoints = {
    sm: 320,
    md: 672,
    lg: 1056,
    xlg: 1312,
    max: 1584,
  };

  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  onMount(() => {
    const width = window.innerWidth;

    if (width > breakpoints.max) size = "max";
    else if (width < breakpoints.md) size = "sm";
    else if (width >= breakpoints.md && width <= breakpoints.lg) size = "md";
    else if (width >= breakpoints.lg && width <= breakpoints.xlg) size = "lg";
    else if (width >= breakpoints.xlg && width <= breakpoints.max) size = "xlg";

    const match = {
      sm: window.matchMedia(`(max-width: ${breakpoints.md}px)`),
      md: window.matchMedia(
        `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg}px)`
      ),
      lg: window.matchMedia(
        `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xlg}px)`
      ),
      xlg: window.matchMedia(
        `(min-width: ${breakpoints.xlg}px) and (max-width: ${breakpoints.max}px)`
      ),
      max: window.matchMedia(`(min-width: ${breakpoints.max}px)`),
    };
    const matchers = Object.entries(match);
    const matchersBySize = Object.fromEntries(
      matchers.map(([size, queryList]) => [queryList.media, size])
    );

    function handleChange({ matches, media }) {
      const size = matchersBySize[media];

      sizes = { ...sizes };
      sizes[size] = matches;
    }

    matchers.forEach(([size, queryList]) =>
      queryList.addEventListener("change", handleChange)
    );

    return () => {
      matchers.forEach(([size, queryList]) =>
        queryList.removeEventListener("change", handleChange)
      );
    };
  });

  $: {
    if (sizes.sm) size = "sm";
    if (sizes.md) size = "md";
    if (sizes.lg) size = "lg";
    if (sizes.xlg) size = "xlg";
    if (sizes.max) size = "max";
    if (size) dispatch("match", { size, breakpointValue: breakpoints[size] });
  }
</script>

<slot sizes="{sizes}" size="{size}" />
