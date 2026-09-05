<script>
  /**
   * @slot {{}}
   */

  /**
   * Specify the gradient color.
   * Defaults to the `layer` theme token.
   * @type {string | undefined}
   */
  export let color = undefined;

  /**
   * Set to `true` to suppress the top and left gradients,
   * even when their edge is scrollable.
   */
  export let hideStartGradient = false;

  /**
   * Specify a class for the inner scrollable element.
   * @type {string | undefined}
   */
  export let scrollElementClassName = undefined;

  import { onMount } from "svelte";

  let scrollRef = null;
  let sentinelTop = null;
  let sentinelBottom = null;
  let sentinelLeft = null;
  let sentinelRight = null;

  let xScrollable = false;
  let yScrollable = false;
  let atTop = true;
  let atBottom = true;
  let atLeft = true;
  let atRight = true;

  $: showTopGradient = yScrollable && !hideStartGradient && !atTop;
  $: showBottomGradient = yScrollable && !atBottom;
  $: showLeftGradient = xScrollable && !hideStartGradient && !atLeft;
  $: showRightGradient = xScrollable && !atRight;

  $: style = color
    ? `--cds-scroll-gradient-color: ${color};${
        $$restProps.style ? ` ${$$restProps.style}` : ""
      }`
    : $$restProps.style;

  function updateScrollable() {
    if (!scrollRef) return;
    xScrollable = scrollRef.scrollWidth > scrollRef.clientWidth;
    yScrollable = scrollRef.scrollHeight > scrollRef.clientHeight;
  }

  onMount(() => {
    updateScrollable();

    const resizeObserver = new ResizeObserver(updateScrollable);
    resizeObserver.observe(scrollRef);

    const mutationObserver = new MutationObserver(updateScrollable);
    mutationObserver.observe(scrollRef, { childList: true, subtree: true });

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === sentinelTop) {
            atTop = entry.isIntersecting;
          } else if (entry.target === sentinelBottom) {
            atBottom = entry.isIntersecting;
          } else if (entry.target === sentinelLeft) {
            atLeft = entry.isIntersecting;
          } else if (entry.target === sentinelRight) {
            atRight = entry.isIntersecting;
          }
        }
      },
      { root: scrollRef },
    );

    for (const sentinel of [
      sentinelTop,
      sentinelBottom,
      sentinelLeft,
      sentinelRight,
    ]) {
      intersectionObserver.observe(sentinel);
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  });
</script>

<div
  class:bx--scroll-gradient={true}
  role="presentation"
  {...$$restProps}
  {style}
>
  <div
    class:bx--scroll-gradient__scroll-element={true}
    class={scrollElementClassName}
    bind:this={scrollRef}
    on:scroll
  >
    <div
      class:bx--scroll-gradient__content={true}
      class:bx--scroll-gradient__content--v-scrollable={yScrollable}
      class:bx--scroll-gradient__content--h-scrollable={xScrollable}
    >
      <div
        class:bx--scroll-gradient__sentinel={true}
        bind:this={sentinelTop}
      ></div>
      <div
        class:bx--scroll-gradient__sentinel={true}
        bind:this={sentinelBottom}
      ></div>
      <div
        class:bx--scroll-gradient__sentinel={true}
        bind:this={sentinelLeft}
      ></div>
      <div
        class:bx--scroll-gradient__sentinel={true}
        bind:this={sentinelRight}
      ></div>
      <slot />
    </div>
  </div>
  {#if showTopGradient}
    <div
      class:bx--scroll-gradient__gradient={true}
      class:bx--scroll-gradient__gradient--top={true}
      role="presentation"
      aria-hidden="true"
    ></div>
  {/if}
  {#if showBottomGradient}
    <div
      class:bx--scroll-gradient__gradient={true}
      class:bx--scroll-gradient__gradient--bottom={true}
      role="presentation"
      aria-hidden="true"
    ></div>
  {/if}
  {#if showLeftGradient}
    <div
      class:bx--scroll-gradient__gradient={true}
      class:bx--scroll-gradient__gradient--left={true}
      role="presentation"
      aria-hidden="true"
    ></div>
  {/if}
  {#if showRightGradient}
    <div
      class:bx--scroll-gradient__gradient={true}
      class:bx--scroll-gradient__gradient--right={true}
      role="presentation"
      aria-hidden="true"
    ></div>
  {/if}
</div>
