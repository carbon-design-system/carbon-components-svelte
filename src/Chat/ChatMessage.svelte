<script>
  /**
   * @restProps {li}
   * @slot {{}} - The message content.
   * @slot {{}} avatar - Shown beside messages from others, such as a UserAvatar of size "sm".
   * @slot {{}} meta - Under the message, such as the time or a delivery status.
   * @slot {{}} actions - Beside the message, such as a reply button.
   */

  /**
   * Specify who sent the message: `"me"` aligns it to the end with the
   * accent color, `"them"` to the start with the avatar.
   * @type {"me" | "them"}
   */
  export let from = "them";

  /**
   * Set to `true` when the previous message has the same author, to group
   * them: the avatar is left out and the gap is smaller.
   */
  export let continued = false;

  /**
   * Set to `true` to show a typing indicator in place of the content.
   */
  export let typing = false;

  /** Specify the text screen readers announce for the typing indicator */
  export let typingText = "Typing";
</script>

<li
  class:bx--chat-message={true}
  class:bx--chat-message--me={from === "me"}
  class:bx--chat-message--continued={continued}
  role={typing ? "status" : undefined}
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
    <div class:bx--chat-message__line={true}>
      {#if typing}
        <div
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
    {#if $$slots.meta && !typing}
      <div class:bx--chat-message__meta={true}><slot name="meta" /></div>
    {/if}
  </div>
</li>
