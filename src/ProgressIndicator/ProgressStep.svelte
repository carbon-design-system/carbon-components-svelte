<script>
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
  import { uniqueId } from "../utils/uniqueId.js";

  let step = {};

  $: stateSuffix = invalid ? ", invalid" : complete ? ", complete" : "";

  const ctx = getContext("carbon:ProgressIndicator");
  const stepsById = ctx?.stepsById ?? writable({});
  const add = ctx?.add ?? (() => {});
  const remove = ctx?.remove ?? (() => {});
  const change = ctx?.change ?? (() => {});
  const preventChangeOnClick = ctx?.preventChangeOnClick ?? writable(false);

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

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  {id}
  class:bx--progress-step={true}
  class:bx--progress-step--current={current}
  class:bx--progress-step--complete={complete}
  class:bx--progress-step--incomplete={!complete && !current}
  class:bx--progress-step--disabled={disabled}
  {...$$restProps}
>
  <button
    type="button"
    {disabled}
    aria-disabled={disabled}
    aria-current={current ? "step" : undefined}
    tabindex={disabled ? "-1" : "0"}
    class:bx--progress-step-button={true}
    class:bx--progress-step-button--unclickable={current ||
      $preventChangeOnClick}
    on:click
    on:click={() => {
      if (!step.complete) return;
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
    {#if stateSuffix}
      <span class:bx--visually-hidden={true}>{stateSuffix}</span>
    {/if}
    <span class:bx--progress-line={true}></span>
  </button>
</li>
