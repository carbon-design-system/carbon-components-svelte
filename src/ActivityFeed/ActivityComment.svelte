<script>
  /**
   * Internal. One comment or reply: avatar, header, body or editor, status
   * and reactions.
   */

  /** @type {import("./activity-feed.js").ActivityItem} */
  export let item;

  /** Set to `true` for a reply, which is drawn smaller */
  export let reply = false;

  /** Set to `true` while the body is an editor */
  export let editing = false;

  /** Set to `true` while the comment asks to be deleted */
  export let confirmingDelete = false;

  import { getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
  import { toTimestamp } from "../utils/relative-time.js";
  import ActivityBody from "./ActivityBody.svelte";
  import ActivityComposer from "./ActivityComposer.svelte";
  import ActivityReactions from "./ActivityReactions.svelte";
  import { ACTIVITY_FEED_CONTEXT } from "./activity-context.js";

  /** @type {import("svelte/store").Readable<import("./activity-context.js").ActivityConfig>} */
  const config = getContext(ACTIVITY_FEED_CONTEXT);

  /** @type {null | HTMLButtonElement} */
  let menuButton = null;
  /** @type {null | HTMLButtonElement} */
  let cancelDeleteButton = null;
  /** @type {undefined | ActivityComposer} */
  let composer;
  let wasEditing = false;
  let wasConfirming = false;

  $: ({ user, texts, now, locale, timeZone, mentionItems, draftKey, handlers } =
    $config);
  $: own = Boolean(user) && item.author.id === user?.id;
  $: editedTitle = item.editedAt
    ? texts.editedTitle(
        getDateTimeFormatter(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone,
        }).format(toTimestamp(item.editedAt)),
      )
    : "";
  $: sending = item.status === "sending";
  $: failed = item.status === "failed";
  $: editable = own && !sending && !failed && item.kind === "comment";

  // Hand focus back to where the reader was: the editor opens focused, and
  // closing it, or the delete prompt, returns to the comment's menu.
  $: if (editing !== wasEditing) {
    wasEditing = editing;
    tick().then(() => (editing ? composer?.focus() : menuButton?.focus()));
  }
  $: if (confirmingDelete !== wasConfirming) {
    wasConfirming = confirmingDelete;
    tick().then(() => {
      if (confirmingDelete) cancelDeleteButton?.focus();
      else menuButton?.focus();
    });
  }
</script>

<div
  class:bx--activity-comment={true}
  class:bx--activity-comment--reply={reply}
  class:bx--activity-comment--sending={sending}
  class:bx--activity-comment--failed={failed}
>
  <UserAvatar
    size="sm"
    name={item.author.name}
    image={item.author.image}
    backgroundColor="auto"
    imageDescription=""
  />
  <div class:bx--activity-comment__main={true}>
    <div class:bx--activity-comment__header={true}>
      <bdi class:bx--activity-comment__author={true}>{item.author.name}</bdi>
      <RelativeTime
        class="bx--activity-comment__time"
        date={item.createdAt}
        {now}
        {locale}
        {timeZone}
        style="short"
      />
      {#if item.editedAt}
        <TooltipDefinition
          direction="bottom"
          portalTooltip
          tooltipText={editedTitle}
          class="bx--activity-comment__edited"
        >
          {texts.edited}
        </TooltipDefinition>
      {/if}
      {#if editable && !editing && !confirmingDelete}
        <span class:bx--activity-comment__menu={true}>
          <OverflowMenu
            size="sm"
            flipped
            portalMenu
            iconDescription={texts.options}
            bind:buttonRef={menuButton}
          >
            <OverflowMenuItem
              text={texts.edit}
              on:click={() => handlers.startEdit(item.id)}
            />
            <OverflowMenuItem
              danger
              hasDivider
              text={texts.delete}
              on:click={() => handlers.askDelete(item.id)}
            />
          </OverflowMenu>
        </span>
      {/if}
    </div>

    {#if editing}
      <ActivityComposer
        bind:this={composer}
        class="bx--activity-comment__editor"
        value={item.body}
        labelText={texts.edit}
        hideLabel
        submitText={texts.save}
        cancelText={texts.cancel}
        cancelable
        {mentionItems}
        draftKey={draftKey ? `${draftKey}:edit:${item.id}` : undefined}
        on:submit={(event) => handlers.saveEdit(item.id, event.detail.body)}
        on:cancel={handlers.cancelEdit}
      />
    {:else}
      <ActivityBody body={item.body} />
    {/if}

    {#if confirmingDelete}
      <div
        role="group"
        aria-label={texts.deleteConfirm}
        class:bx--activity-comment__confirm={true}
      >
        <span>{texts.deleteConfirm}</span>
        <Button
          kind="ghost"
          size="sm"
          bind:ref={cancelDeleteButton}
          on:click={handlers.cancelDelete}>{texts.cancel}</Button
        >
        <Button
          kind="danger"
          size="sm"
          on:click={() => handlers.confirmDelete(item.id)}
          >{texts.deleteConfirmAction}</Button
        >
      </div>
    {/if}

    {#if sending}
      <p class:bx--activity-comment__status={true}>{texts.sending}</p>
    {:else if failed}
      <p
        class:bx--activity-comment__status={true}
        class:bx--activity-comment__status--error={true}
      >
        {texts.failed}
        <Button kind="ghost" size="sm" on:click={() => handlers.retry(item.id)}
          >{texts.retry}</Button
        >
        <Button
          kind="ghost"
          size="sm"
          on:click={() => handlers.discard(item.id)}>{texts.discard}</Button
        >
      </p>
    {:else if item.kind === "comment" && !editing}
      <ActivityReactions {item} />
    {/if}
  </div>
</div>
