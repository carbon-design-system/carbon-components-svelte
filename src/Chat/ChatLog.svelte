<script>
  /**
   * @restProps {div}
   * @slot {{}} - ChatMessage and ChatDivider items.
   */

  /** Specify the accessible name of the conversation, such as "Conversation with Sam" */
  export let labelText = "";

  /**
   * Obtain a reference to the scrolling log element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";

  /** How close to the end, in pixels, still counts as reading the latest. */
  const NEAR_END = 48;
  let pinned = true;

  function handleScroll() {
    if (!ref) return;
    pinned = ref.scrollHeight - ref.scrollTop - ref.clientHeight <= NEAR_END;
  }

  /** @param {MutationRecord[]} records */
  function sentByMe(records) {
    return records.some((record) =>
      [...record.addedNodes].some(
        (node) =>
          node instanceof Element &&
          node.classList.contains("bx--chat-message--me"),
      ),
    );
  }

  onMount(() => {
    if (!ref) return;
    ref.scrollTop = ref.scrollHeight;
    // New messages scroll into view only while the reader is at the end,
    // so reading back through the conversation is never interrupted. A
    // message the user just sent always comes into view.
    const observer = new MutationObserver((records) => {
      if (!ref) return;
      if (sentByMe(records)) pinned = true;
      if (pinned) ref.scrollTop = ref.scrollHeight;
    });
    observer.observe(ref, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  });
</script>

<!-- The log wraps a real list, so screen readers keep list navigation;
     `role="log"` already announces additions politely. It takes focus so
     keyboard users can scroll it. -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this={ref}
  role="log"
  aria-label={labelText || undefined}
  tabindex="0"
  class:bx--chat-log={true}
  {...$$restProps}
  on:scroll={handleScroll}
>
  <ol class:bx--chat-log__list={true}>
    <slot />
  </ol>
</div>
