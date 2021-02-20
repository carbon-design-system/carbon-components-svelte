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
  import CheckmarkOutline16 from "carbon-icons-svelte/lib/CheckmarkOutline16/CheckmarkOutline16.svelte";
  import Warning16 from "carbon-icons-svelte/lib/Warning16/Warning16.svelte";

  let step = {};

  const { stepsById, add, change } = getContext("ProgressIndicator");

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
    disabled="{disabled}"
    aria-disabled="{disabled}"
    tabindex="{!current && !disabled ? '0' : '-1'}"
    class:bx--progress-step-button="{true}"
    class:bx--progress-step-button--unclickable="{current}"
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
      if (e.key === ' ' || e.key === 'Enter') {
        change(step.index);
      }
    }}"
  >
    {#if invalid}
      <Warning16 class="bx--progress__warning" title="{description}" />
    {:else if current}
      <svg>
        <path d="M 7, 7 m -7, 0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0"></path>
        <title>{description}</title>
      </svg>
    {:else if complete}
      <CheckmarkOutline16 title="{description}" />
    {:else}
      <svg>
        <title>{description}</title>
        <path
          d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3
          0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"
        ></path>
      </svg>
    {/if}
    <slot props="{{ class: 'bx--progress-label' }}">
      <p class:bx--progress-label="{true}">{label}</p>
    </slot>
    {#if secondaryLabel}
      <p class:bx--progress-optional="{true}">{secondaryLabel}</p>
    {/if}
    <span class:bx--progress-line="{true}"></span>
  </button>
</li>
