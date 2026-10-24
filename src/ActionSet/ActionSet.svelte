<script context="module">
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

  const KINDS = [
    "primary",
    "secondary",
    "tertiary",
    "danger",
    "danger-tertiary",
    "ghost",
    "danger-ghost",
  ];

  /**
   * The kind of an action from its `bx--btn--{kind}` class, else "other".
   * @param {Element} node
   */
  function kindOf(node) {
    return (
      KINDS.find((kind) => node.classList.contains(`bx--btn--${kind}`)) ??
      "other"
    );
  }

  /**
   * Carbon's ActionSet rules for a set of action kinds.
   * @param {string[]} kinds
   * @param {boolean} stacking
   * @returns {string[]}
   */
  function findProblems(kinds, stacking) {
    const count = (/** @type {string[]} */ ...names) =>
      kinds.filter((kind) => names.includes(kind)).length;
    const ghosts = count("ghost", "danger-ghost");
    return [
      stacking &&
        kinds.length > 3 &&
        "takes at most three actions when they stack",
      kinds.length > 4 && "takes at most four actions",
      count("primary") > 1 && "takes at most one primary action",
      ghosts > 1 && "takes at most one ghost action",
      stacking &&
        kinds.length > 1 &&
        ghosts > 0 &&
        "can't stack a ghost action with other actions",
      count("other") > 0 && "takes only Button actions",
    ].filter((problem) => typeof problem === "string");
  }
</script>

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

  /**
   * Set to `true` to stick the action set to the bottom of its nearest
   * scroll container, for example a save bar under a long form.
   */
  export let sticky = false;

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import ButtonSet from "../Button/ButtonSet.svelte";

  const buttonSize = writable(BUTTON_SIZES[size]);
  $: buttonSize.set(BUTTON_SIZES[size]);

  // Button reads this to fall back to ActionSet's size when it has none of
  // its own set, the same way it reads carbon:Modal for portalTooltip.
  setContext("carbon:ActionSet", { size: buttonSize });

  let ref = null;
  /** @type {string[]} */
  let actionKinds = [];

  function syncActionCount() {
    actionKinds = Array.from(ref?.children ?? [], kindOf);
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

  $: actionCount = actionKinds.length;
  $: stacking =
    !disableStacking && (size === "sm" || (size === "md" && actionCount > 2));

  // Warn once per problem, as the actions change.
  const warned = new Set();
  $: for (const problem of findProblems(actionKinds, stacking)) {
    if (warned.has(problem)) continue;
    warned.add(problem);
    console.warn(`[ActionSet.svelte] an action set ${problem}.`);
  }
  $: wrapperClass = [
    "bx--action-set",
    `bx--action-set--${size}`,
    stacking && "bx--action-set--stacking",
    sticky && "bx--action-set--sticky",
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
