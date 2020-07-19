<script>
  export let complete = false;
  export let current = false;
  export let disabled = false;
  export let invalid = false;
  export let description = "";
  export let label = "";
  export let secondaryLabel = "";
  export let id = "ccs-" + Math.random().toString(36);

  import { getContext } from "svelte";
  import CheckmarkOutline16 from "carbon-icons-svelte/lib/CheckmarkOutline16";
  import Warning16 from "carbon-icons-svelte/lib/Warning16";

  const { stepsById, add, change } = getContext("ProgressIndicator");

  add({ id, disabled });

  $: step = $stepsById[id];
  $: {
    current = step.current;
    complete = step.complete;
  }
</script>

<li
  aria-disabled={disabled}
  class:bx--progress-step={true}
  class:bx--progress-step--current={current}
  class:bx--progress-step--complete={complete}
  class:bx--progress-step--incomplete={!complete && !current}
  class:bx--progress-step--disabled={disabled}
  {...$$restProps}>
  <div
    role="button"
    tabindex={current ? '-1' : '0'}
    class:bx--progress-step-button={true}
    class:bx--progress-step-button--unclickable={current}
    on:click={() => {
      change(step.index);
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={e => {
      if (e.key === ' ' || e.key === 'Enter') {
        change(step.index);
      }
    }}>
    {#if invalid}
      <Warning16 class="bx--progress__warning" />
    {:else if current}
      <svg>
        <path d="M 7, 7 m -7, 0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0" />
        <title>{description}</title>
      </svg>
    {:else if complete}
      <CheckmarkOutline16 title={description} />
    {:else}
      <svg>
        <title>{description}</title>
        <path
          d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3
          0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
      </svg>
    {/if}
    <slot props={{ class: 'bx--progress-label' }}>
      <p class:bx--progress-label={true}>{label}</p>
    </slot>
    {#if secondaryLabel}
      <p class:bx--progress-optional={true}>{secondaryLabel}</p>
    {/if}
    <span class:bx--progress-line={true} />
  </div>
</li>
