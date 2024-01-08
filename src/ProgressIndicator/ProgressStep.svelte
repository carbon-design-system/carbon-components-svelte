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
  id="{id}"
  class:cds--progress-step="{true}"
  class:cds--progress-step--current="{current}"
  class:cds--progress-step--complete="{complete}"
  class:cds--progress-step--incomplete="{!complete && !current}"
  class:cds--progress-step--disabled="{disabled}"
  {...$$restProps}
>
  <button
    type="button"
    disabled="{disabled}"
    aria-disabled="{disabled}"
    tabindex="{!current && !disabled ? '0' : '-1'}"
    class:cds--progress-step-button="{true}"
    class:cds--progress-step-button--unclickable="{current ||
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
      <Warning class="cds--progress__warning" title="{description}" />
    {:else if current}
      <Incomplete title="{description}" />
    {:else if complete}
      <CheckmarkOutline title="{description}" />
    {:else}
      <CircleDash title="{description}" />
    {/if}
    <div class:cds--progress-text="{true}">
      <slot props="{{ class: 'cds--progress-label' }}">
        <p class:cds--progress-label="{true}">{label}</p>
      </slot>
      {#if secondaryLabel}
        <p class:cds--progress-optional="{true}">{secondaryLabel}</p>
      {/if}
    </div>
    <span class:cds--progress-line="{true}"></span>
  </button>
</li>
