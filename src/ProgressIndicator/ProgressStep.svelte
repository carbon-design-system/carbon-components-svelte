<script>
  /**
   * @restProps {li}
   */

  /** Set to `true` for the complete variant */
  export let complete = false;

  /**
   * Set to `true` to use the current variant.
   * @bindable writable
   */
  export let current = false;

  /** Set to `true` to disable the progress step */
  export let disabled = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the step description */
  export let description = "";

  /** Specify the step label */
  export let label = "";

  /** Specify the step secondary label */
  export let secondaryLabel = "";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import CheckmarkOutline from "../icons/CheckmarkOutline.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import Incomplete from "../icons/Incomplete.svelte";
  import Warning from "../icons/Warning.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { noop } from "../utils/noop.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  let step = {};

  // Naming and description belong on the step button, not the `li`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  /** @param {"complete" | "invalid"} status */
  function defaultStatusText(status) {
    return status;
  }

  const ctx = getContext("carbon:ProgressIndicator");
  const statusText = ctx?.statusText ?? writable(defaultStatusText);
  const stepsById = ctx?.stepsById ?? writable({});
  const add = ctx?.add ?? noop;
  const remove = ctx?.remove ?? noop;
  const change = ctx?.change ?? noop;
  const preventChangeOnClick = ctx?.preventChangeOnClick ?? writable(false);

  $: status = invalid ? "invalid" : complete ? "complete" : undefined;

  // Current before the batched registration reports, so a server render
  // marks it (see `initial` in ProgressIndicator).
  if (ctx?.initial) {
    const { claimIndex, currentIndex, selectedId } = ctx.initial;
    const index = claimIndex();
    current =
      current ||
      (selectedId === undefined ? index === currentIndex : selectedId === id);
  }

  $: add({ id, complete, disabled });

  const unsubscribe = stepsById.subscribe((value) => {
    if (value[id]) {
      step = value[id];
      current = step.current;
    }
  });

  onMount(() => {
    return () => {
      unsubscribe();
      remove(id);
    };
  });
</script>

<li
  {id}
  class:bx--progress-step={true}
  class:bx--progress-step--current={current}
  class:bx--progress-step--complete={complete}
  class:bx--progress-step--incomplete={!complete && !current}
  class:bx--progress-step--disabled={disabled}
  {...wrapperProps}
>
  <button
    type="button"
    {disabled}
    aria-disabled={disabled}
    aria-current={current ? "step" : undefined}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    tabindex={disabled ? -1 : 0}
    class:bx--progress-step-button={true}
    class:bx--progress-step-button--unclickable={current ||
      !complete ||
      $preventChangeOnClick}
    use:titleWhenTruncated={{ measure: ".bx--progress-label" }}
    on:click
    on:click={() => {
      if (!step.complete || step.current) return;
      change(step.index);
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:focus
    on:blur
  >
    <slot name="icon" {complete} {current} {invalid} {description}>
      {#if invalid}
        <Warning class="bx--progress__warning" title={description} />
      {:else if current}
        <Incomplete title={description} />
      {:else if complete}
        <CheckmarkOutline title={description} />
      {:else}
        <CircleDash title={description} />
      {/if}
    </slot>
    <div class:bx--progress-text={true}>
      <slot props={{ class: "bx--progress-label" }}>
        <span class:bx--progress-label={true}>{label}</span>
      </slot>
      {#if secondaryLabel}
        <span class:bx--progress-optional={true}>{secondaryLabel}</span>
      {/if}
    </div>
    {#if status}
      <span class:bx--visually-hidden={true}>, {$statusText(status)}</span>
    {/if}
    <span class:bx--progress-line={true}></span>
  </button>
</li>
