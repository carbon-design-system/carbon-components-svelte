<script>
  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import { LAYER_CONTEXT_KEY } from "../constants/context-keys.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";

  const composedModalCtx = getContext("carbon:ComposedModal");
  const modalLabel = composedModalCtx?.label ?? writable(undefined);
  const modalTitle = composedModalCtx?.title ?? writable(undefined);
  const modalIds = composedModalCtx?.ids ?? writable({});

  // As in v11, the body is a layer at level 1, so a `Layer` inside sits at 2.
  setContext(LAYER_CONTEXT_KEY, readable(2));

  // Give the body an id ComposedModal can reference from `aria-describedby`
  // in alert mode. A consumer `id` wins and is reported instead.
  $: resolvedId = $$restProps.id ?? $modalIds.body;
  $: composedModalCtx?.setBodyId?.(resolvedId);
  onMount(() => () => composedModalCtx?.setBodyId?.(undefined));

  // Name the region with ModalHeader's label/title heading when the
  // consumer hasn't already supplied their own aria-label/aria-labelledby.
  $: regionLabelledby =
    !$$restProps["aria-label"] && !$$restProps["aria-labelledby"]
      ? $modalLabel
        ? $modalIds.label
        : $modalTitle
          ? $modalIds.title
          : undefined
      : undefined;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this={ref}
  id={resolvedId}
  tabindex={hasScrollingContent ? "0" : undefined}
  role={hasScrollingContent ? "region" : undefined}
  aria-labelledby={hasScrollingContent ? regionLabelledby : undefined}
  class:bx--modal-content={true}
  class:bx--layer-two={true}
  class:bx--modal-content--with-form={hasForm}
  class:bx--modal-scroll-content={hasScrollingContent}
  on:focusin={(event) => {
    // Keep a newly-focused element (e.g. via Tab) from being hidden under
    // the scroll gradient at the bottom of the content area.
    if (event.target instanceof HTMLElement) {
      scrollIntoViewWithin(event.target, ".bx--modal-content");
    }
  }}
  {...$$restProps}
>
  <slot />
</div>
{#if hasScrollingContent}
  <div class:bx--modal-content--overflow-indicator={true}></div>
{/if}
