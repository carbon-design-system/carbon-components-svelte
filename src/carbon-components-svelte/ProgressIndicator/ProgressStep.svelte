<script>
  /** Set to `true` for the complete variant */
  export let complete = false;

  /** Set to `true` to use the current variant */
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
  export let id = "ccs-" + Math.random().toString(36);

  import { onMount, getContext } from "svelte";
  import CheckmarkOutline from "../icons/CheckmarkOutline.svelte";
  import Warning from "../icons/Warning.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import Incomplete from "../icons/Incomplete.svelte";

  let step = {};

  const { stepsById, add, change, preventChangeOnClick } =
    getContext("ProgressIndicator");

  $: add({ id, complete, disabled });

  const unsubscribe = stepsById.subscribe((value) => {
    if (value[id]) {
      step = value[id];
      current = step.current;
      complete = step.complete;
    }
  });

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  aria-disabled="{disabled}"
  id="{id}"
  class:bx--progress-step="{true}"
  class:bx--progress-step--current="{current}"
  class:bx--progress-step--complete="{complete}"
  class:bx--progress-step--incomplete="{!complete && !current}"
  class:bx--progress-step--disabled="{disabled}"
  {...$$restProps}
>
  <button
    type="button"
    disabled="{disabled}"
    aria-disabled="{disabled}"
    tabindex="{!current && !disabled ? '0' : '-1'}"
    class:bx--progress-step-button="{true}"
    class:bx--progress-step-button--unclickable="{current ||
      $preventChangeOnClick}"
    on:click
    on:click="{() => {
      if (!step.complete) return;
      change(step.index);
    }}"
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown="{(e) => {
      if (!step.complete) return;
      if (e.key === ' ' || e.key === 'Enter') {
        change(step.index);
      }
    }}"
  >
    {#if invalid}
      <Warning class="bx--progress__warning" title="{description}" />
    {:else if current}
      <Incomplete title="{description}" />
    {:else if complete}
      <CheckmarkOutline title="{description}" />
    {:else}
      <CircleDash title="{description}" />
    {/if}
    <div class:bx--progress-text="{true}">
      <slot props="{{ class: 'bx--progress-label' }}">
        <p class:bx--progress-label="{true}">{label}</p>
      </slot>
      {#if secondaryLabel}
        <p class:bx--progress-optional="{true}">{secondaryLabel}</p>
      {/if}
    </div>
    <span class:bx--progress-line="{true}"></span>
  </button>
</li>
