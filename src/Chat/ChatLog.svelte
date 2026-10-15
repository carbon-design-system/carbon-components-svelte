<script>
  /**
   * @restProps {ol}
   * @slot {{}} - ChatMessage and ChatDivider items.
   */

  /** Specify the accessible name of the conversation, such as "Conversation with Sam" */
  export let labelText = "";

  /**
   * Obtain a reference to the list element.
   * @type {null | HTMLOListElement}
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

  onMount(() => {
    if (!ref) return;
    ref.scrollTop = ref.scrollHeight;
    // New messages scroll into view only while the reader is at the end,
    // so reading back through the conversation is never interrupted.
    const observer = new MutationObserver(() => {
      if (pinned && ref) ref.scrollTop = ref.scrollHeight;
    });
    observer.observe(ref, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  });
</script>

<ol
  bind:this={ref}
  role="log"
  aria-label={labelText || undefined}
  aria-live="polite"
  class:bx--chat-log={true}
  {...$$restProps}
  on:scroll={handleScroll}
>
  <slot />
</ol>
