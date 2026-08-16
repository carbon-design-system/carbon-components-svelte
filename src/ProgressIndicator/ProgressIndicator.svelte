<script>
  /**
   * Specify the current step index.
   * Ignored when `selectedId` is set.
   * @bindable writable
   */
  export let currentIndex = 0;

  /**
   * Specify the current step by id.
   * When set, takes precedence over `currentIndex` and stays on the same
   * logical step as steps are added or removed. Pair with a stable `id` on
   * each `ProgressStep`.
   * @bindable writable
   * @type {string | undefined}
   */
  export let selectedId = undefined;

  /** Set to `true` to use the vertical variant */
  export let vertical = false;

  /** Set to `true` to specify whether the progress steps should be split equally in size in the div */
  export let spaceEqually = false;

  /** Set to `true` to prevent `currentIndex` from updating */
  export let preventChangeOnClick = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { derived, writable } from "svelte/store";
  import { batchStoreUpdates } from "../utils/batchStoreUpdates.js";
  import { clampIndex } from "../utils/clampIndex.js";
  import { keyBy } from "../utils/keyBy.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; complete: boolean; disabled: boolean; index: number; current: boolean }>>}
   */
  const steps = writable([]);
  /**
   * @type {import("svelte/store").Readable<Record<string, { id: string; complete: boolean; disabled: boolean; index: number; current: boolean }>>}
   */
  const stepsById = derived(steps, (steps) => keyBy(steps));
  const preventChangeOnClickStore = writable(preventChangeOnClick);

  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const preventChangeOnClickReadable = {
    subscribe: preventChangeOnClickStore.subscribe,
  };

  // Batch child registration. Dedup and patch against `_` (this batch's
  // accumulator), not `$stepsById`. The derived store is the last flushed
  // value, so a same-batch id looks unregistered if you check it there.
  const batchedStepsUpdate = batchStoreUpdates(steps);

  /**
   * @type {(step: { id: string; complete: boolean; disabled: boolean }) => void}
   */
  function add(step) {
    batchedStepsUpdate((_) => {
      const index = _.findIndex((_step) => _step.id === step.id);
      if (index !== -1) {
        return _.map((_step, i) =>
          i === index ? { ..._step, ...step } : _step,
        );
      }

      return [
        ..._,
        {
          ...step,
          index: _.length,
          current: _.length === currentIndex,
          complete: step.complete,
        },
      ];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function remove(id) {
    batchedStepsUpdate((_) =>
      _.filter((step) => step.id !== id).map((step, i) => ({
        ...step,
        index: i,
      })),
    );
  }

  /**
   * @type {(index: number) => void}
   */
  function change(index) {
    if (preventChangeOnClick) return;

    if (selectedId === undefined) {
      currentIndex = index;
    } else {
      const step = $steps[index];
      if (!step) return;
      selectedId = step.id;
    }

    /** @event {number} change */
    dispatch("change", index);
  }

  /**
   * Resolve `currentIndex` from `selectedId` when set. If the selected id was
   * removed, keep the same index (next step) or clamp, and re-anchor
   * `selectedId` to whatever step that resolves to.
   * @type {() => void}
   */
  function syncSelection() {
    if (selectedId === undefined) return;

    const step = $stepsById[selectedId];
    if (step) {
      currentIndex = step.index;
      return;
    }

    if ($steps.length === 0) return;

    currentIndex = clampIndex(currentIndex, 0, $steps.length);
    selectedId = $steps[currentIndex]?.id;
  }

  setContext("carbon:ProgressIndicator", {
    steps,
    stepsById,
    preventChangeOnClick: preventChangeOnClickReadable,
    add,
    remove,
    change,
  });

  // Combined into one statement (rather than a separate syncSelection()
  // block feeding this one) so the flag recompute always runs in the same
  // pass right after syncSelection(), using the just-resolved currentIndex.
  // Svelte skips re-invalidating `currentIndex` when syncSelection() (called
  // from a different reactive statement) reassigns it to the same numeric
  // value, which would otherwise leave stale `current` flags on removal.
  // This also makes the recompute run on every steps add/remove (via
  // `$stepsById`), not just when currentIndex itself changes.
  $: {
    if (selectedId !== undefined && $stepsById) {
      syncSelection();
    }
    steps.update((_) =>
      _.map((step, i) => ({
        ...step,
        current: i === currentIndex,
      })),
    );
  }
  $: preventChangeOnClickStore.set(preventChangeOnClick);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<ul
  class:bx--progress={true}
  class:bx--progress--vertical={vertical}
  class:bx--progress--space-equal={spaceEqually && !vertical}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ul>
