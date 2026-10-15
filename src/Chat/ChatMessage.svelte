<script>
  /**
   * @restProps {li}
   * @slot {{}} - The message content.
   * @slot {{}} avatar - Shown beside messages from others, such as a UserAvatar of size "sm".
   * @event {null} retry
   * @slot {{}} meta - Under the message, such as the time. Show it on the last message of a group.
   * @slot {{}} actions - Beside the message, such as a reply button.
   * @slot {{}} attachments - Under the message, outside its bubble, such as an image, a file, a link card or a code block.
   */

  /**
   * Specify who sent the message: `"me"` aligns it to the end with the
   * accent color, `"them"` to the start with the avatar.
   * @type {"me" | "them"}
   */
  export let from = "them";

  /**
   * Specify who sent the message, such as "Sam", or "You" for your own.
   * Screen readers announce it before the message, since alignment alone
   * doesn't say who is speaking.
   */
  export let author = "";

  /**
   * Set to `true` to also show `author` above the first message of a
   * group, as in a group chat.
   */
  export let showAuthor = false;

  /**
   * Set to `true` when the previous message has the same author, to group
   * them: the avatar is left out and the gap is smaller.
   */
  export let continued = false;

  /**
   * Set to `true` while the message is still arriving, such as a reply
   * streamed word by word. Screen readers wait and announce it once, in
   * full, instead of every chunk.
   */
  export let streaming = false;

  /**
   * Set to `true` to show a typing indicator in place of the content.
   */
  export let typing = false;

  /** Specify the text screen readers announce for the typing indicator */
  export let typingText = "Typing";

  /**
   * Set the delivery status of your own message, shown with the meta line.
   * Show it on the last message of a group. `"failed"` adds a Retry button
   * that dispatches `retry`.
   * @type {undefined | "sending" | "sent" | "delivered" | "read" | "failed"}
   */
  export let status = undefined;

  /**
   * Specify the text for each delivery status.
   * @type {(status: "sending" | "sent" | "delivered" | "read" | "failed") => string}
   */
  export let statusText = (status) =>
    ({
      sending: "Sending",
      sent: "Sent",
      delivered: "Delivered",
      read: "Read",
      failed: "Not sent",
    })[status];

  /** Specify the text of the Retry button for a failed message */
  export let retryText = "Retry";

  import { createEventDispatcher } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import CheckmarkOutline from "../icons/CheckmarkOutline.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const dispatch = createEventDispatcher();

  const STATUS_ICONS = {
    sending: CircleDash,
    sent: Checkmark,
    delivered: CheckmarkOutline,
    read: CheckmarkFilled,
    failed: WarningFilled,
  };
</script>

<li
  class:bx--chat-message={true}
  class:bx--chat-message--me={from === "me"}
  class:bx--chat-message--continued={continued}
  class:bx--chat-message--streaming={streaming}
  class:bx--chat-message--with-status={!!status && !typing}
  aria-busy={streaming || undefined}
  {...$$restProps}
>
  {#if from === "them"}
    <span class:bx--chat-message__avatar={true}>
      {#if !continued}
        <slot name="avatar" />
      {/if}
    </span>
  {/if}
  <div class:bx--chat-message__main={true}>
    {#if author}
      <span
        class:bx--chat-message__author={true}
        class:bx--visually-hidden={!showAuthor || continued}
        >{author}</span
      >
    {/if}
    <div class:bx--chat-message__line={true}>
      {#if typing}
        <!-- The status sits inside the list item, so the list keeps its
             items. -->
        <div
          role="status"
          class:bx--chat-message__bubble={true}
          class:bx--chat-message__bubble--typing={true}
        >
          <span class:bx--chat-message__dot={true} aria-hidden="true"></span>
          <span class:bx--chat-message__dot={true} aria-hidden="true"></span>
          <span class:bx--chat-message__dot={true} aria-hidden="true"></span>
          <span class:bx--visually-hidden={true}>{typingText}</span>
        </div>
      {:else}
        <div class:bx--chat-message__bubble={true}><slot /></div>
      {/if}
      {#if $$slots.actions && !typing}
        <span class:bx--chat-message__actions={true}
          ><slot name="actions" /></span
        >
      {/if}
    </div>
    {#if $$slots.attachments && !typing}
      <div class:bx--chat-message__attachments={true}>
        <slot name="attachments" />
      </div>
    {/if}
    {#if ($$slots.meta || status) && !typing}
      <div class:bx--chat-message__meta={true}>
        <slot name="meta" />
        {#if status}
          <span
            class:bx--chat-message__status={true}
            class:bx--chat-message__status--failed={status === "failed"}
          >
            <svelte:component
              this={STATUS_ICONS[status]}
              class="bx--chat-message__status-icon"
            />
            {statusText(status)}
            {#if status === "failed"}
              <button
                type="button"
                class:bx--chat-message__retry={true}
                on:click={() => dispatch("retry")}
              >
                {retryText}
              </button>
            {/if}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</li>
