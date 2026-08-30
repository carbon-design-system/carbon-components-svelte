<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the size of the action set. Different button arrangements are
   * used at different sizes to make the best use of available space. Also
   * sets the default size for child `Button`s that don't set their own
   * `size`.
   * @type {"sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "md";

  /**
   * Set to `true` to prevent automatic stacking, even when `size` would
   * normally trigger it (`"sm"`, or `"md"` with more than two actions).
   */
  export let disableStacking = false;

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import ButtonSet from "../Button/ButtonSet.svelte";

  /**
   * Button's own size scale ("default"/"field"/"small"/"lg"/"xl") is offset
   * from ActionSet's v11-derived scale. Same idea as the size table in
   * ComboButton.svelte.
   */
  const BUTTON_SIZES = {
    sm: "small",
    md: "field",
    lg: "default",
    xl: "lg",
    "2xl": "xl",
  };

  const buttonSize = writable(BUTTON_SIZES[size]);
  $: buttonSize.set(BUTTON_SIZES[size]);

  // Button reads this to fall back to ActionSet's size when it has none of
  // its own set, the same way it reads carbon:Modal for portalTooltip.
  setContext("carbon:ActionSet", { size: buttonSize });

  let ref = null;
  let actionCount = 0;

  function syncActionCount() {
    actionCount = ref?.children.length ?? 0;
  }

  // Children are real, consumer-placed <Button>s, not a data array, so
  // stacking's action count has to be measured from the DOM rather than
  // read off a prop. Observe childList in case actions are added/removed
  // after mount.
  onMount(() => {
    syncActionCount();
    const observer = new MutationObserver(syncActionCount);
    observer.observe(ref, { childList: true });
    return () => observer.disconnect();
  });

  $: stacking =
    !disableStacking && (size === "sm" || (size === "md" && actionCount > 2));
  $: wrapperClass = [
    "bx--action-set",
    `bx--action-set--${size}`,
    stacking && "bx--action-set--stacking",
    !stacking && actionCount === 1 && "bx--action-set--row-single",
    !stacking && actionCount === 2 && "bx--action-set--row-double",
    !stacking && actionCount === 3 && "bx--action-set--row-triple",
    !stacking && actionCount >= 4 && "bx--action-set--row-quadruple",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<ButtonSet
  {...$$restProps}
  bind:ref
  class={wrapperClass}
  stacked={stacking}
  role="presentation"
>
  <slot />
</ButtonSet>
