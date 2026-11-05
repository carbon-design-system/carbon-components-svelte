<script>
  /**
   * @restProps {div}
   * @slot {{}} - ChatMessage and ChatDivider items.
   * @event {null} jump
   */

  /** Specify the accessible name of the conversation, such as "Conversation with Sam" */
  export let labelText = "";

  /** Specify the label of the button that returns to the latest message */
  export let jumpText = "Jump to latest";

  /**
   * Whether the reader is at the latest message. While they are, new
   * messages and the growth of the last one stay in view; once they scroll
   * back, the log leaves the scroll alone and shows a button that jumps to
   * the latest.
   * @bindable readonly
   */
  export let atLatest = true;

  /**
   * Obtain a reference to the scrolling log element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Scroll to the latest message and keep it in view from then on. The
   * jump is immediate, not animated.
   */
  export function scrollToLatest() {
    if (!ref) return;
    pinned = true;
    atLatest = true;
    ref.scrollTop = ref.scrollHeight;
  }

  import { createEventDispatcher, onMount } from "svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ChatButton from "./ChatButton.svelte";

  const dispatch = createEventDispatcher();

  /** How close to the end, in pixels, still counts as reading the latest. */
  const NEAR_END = 48;
  let pinned = true;

  function handleScroll() {
    if (!ref) return;
    pinned = ref.scrollHeight - ref.scrollTop - ref.clientHeight <= NEAR_END;
    atLatest = pinned;
  }

  function jump() {
    scrollToLatest();
    dispatch("jump");
    // The button is about to go, and focus goes with it.
    ref?.focus({ preventScroll: true });
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
      if (sentByMe(records)) {
        pinned = true;
        atLatest = true;
      }
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
     keyboard users can scroll it. The jump button sits at the end of the
     log in a box with no height, pinned to the bottom edge, so showing it
     moves nothing; the box isn't announced when the button appears. -->
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
  <div class:bx--chat-log__jump={true} aria-live="off">
    {#if !atLatest}
      <ChatButton
        size="small"
        kind="secondary"
        icon={ArrowDown}
        on:click={jump}
      >
        {jumpText}
      </ChatButton>
    {/if}
  </div>
</div>
