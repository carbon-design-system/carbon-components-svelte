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
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  let step = {};

  // Naming and description belong on the step button, not the `li`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  $: stateSuffix = invalid ? ", invalid" : complete ? ", complete" : "";

  const ctx = getContext("carbon:ProgressIndicator");
  const stepsById = ctx?.stepsById ?? writable({});
  const add = ctx?.add ?? noop;
  const remove = ctx?.remove ?? noop;
  const change = ctx?.change ?? noop;
  const preventChangeOnClick = ctx?.preventChangeOnClick ?? writable(false);

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
    tabindex={disabled ? "-1" : "0"}
    class:bx--progress-step-button={true}
    class:bx--progress-step-button--unclickable={current ||
      !complete ||
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          width="16"
          height="16"
          aria-hidden={description ? undefined : true}
          role={description ? "img" : undefined}
          class="bx--progress__warning"
        >
          {#if description}
            <title>{description}</title>
          {/if}
          <path
            d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z"
          ></path>
          <path
            d="M15 8H17V19H15zM16 22a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 22z"
          ></path>
        </svg>
      {:else if current}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          width="16"
          height="16"
          aria-hidden={description ? undefined : true}
          role={description ? "img" : undefined}
        >
          {#if description}
            <title>{description}</title>
          {/if}
          <path
            d="M23.7642 6.8593l1.2851-1.5315A13.976 13.976 0 0020.8672 2.887l-.6836 1.8776A11.9729 11.9729 0 0123.7642 6.8593zM27.81 14l1.9677-.4128A13.8888 13.8888 0 0028.14 9.0457L26.4087 10A12.52 12.52 0 0127.81 14zM20.1836 27.2354l.6836 1.8776a13.976 13.976 0 004.1821-2.4408l-1.2851-1.5315A11.9729 11.9729 0 0120.1836 27.2354zM26.4087 22L28.14 23a14.14 14.14 0 001.6382-4.5872L27.81 18.0659A12.1519 12.1519 0 0126.4087 22zM16 30V2a14 14 0 000 28z"
          ></path>
        </svg>
      {:else if complete}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          width="16"
          height="16"
          aria-hidden={description ? undefined : true}
          role={description ? "img" : undefined}
        >
          {#if description}
            <title>{description}</title>
          {/if}
          <path
            d="M14 21.414L9 16.413 10.413 15 14 18.586 21.585 11 23 12.415 14 21.414z"
          ></path>
          <path
            d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z"
          ></path>
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          width="16"
          height="16"
          aria-hidden={description ? undefined : true}
          role={description ? "img" : undefined}
        >
          {#if description}
            <title>{description}</title>
          {/if}
          <path
            d="M7.7 4.7a14.7 14.7 0 00-3 3.1L6.3 9A13.26 13.26 0 018.9 6.3zM4.6 12.3l-1.9-.6A12.51 12.51 0 002 16H4A11.48 11.48 0 014.6 12.3zM2.7 20.4a14.4 14.4 0 002 3.9l1.6-1.2a12.89 12.89 0 01-1.7-3.3zM7.8 27.3a14.4 14.4 0 003.9 2l.6-1.9A12.89 12.89 0 019 25.7zM11.7 2.7l.6 1.9A11.48 11.48 0 0116 4V2A12.51 12.51 0 0011.7 2.7zM24.2 27.3a15.18 15.18 0 003.1-3.1L25.7 23A11.53 11.53 0 0123 25.7zM27.4 19.7l1.9.6A15.47 15.47 0 0030 16H28A11.48 11.48 0 0127.4 19.7zM29.2 11.6a14.4 14.4 0 00-2-3.9L25.6 8.9a12.89 12.89 0 011.7 3.3zM24.1 4.6a14.4 14.4 0 00-3.9-2l-.6 1.9a12.89 12.89 0 013.3 1.7zM20.3 29.3l-.6-1.9A11.48 11.48 0 0116 28v2A21.42 21.42 0 0020.3 29.3z"
          ></path>
        </svg>
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
