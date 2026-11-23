<script>
  /**
   * Internal. One article of the feed: a comment with its replies, or a
   * group of events, under a day divider when it begins a day.
   */

  /** @type {import("./activity-feed.js").ActivityRow} */
  export let row;

  /** The place of the row in the feed, from 1 */
  export let posinset = /** @type {number | undefined} */ (undefined);

  /** The number of rows in the feed, or -1 when older ones are not loaded */
  export let setsize = /** @type {number | undefined} */ (undefined);

  /** The id of the comment or reply being edited */
  export let editingId = "";

  /** The id of the comment being replied to */
  export let replyingId = "";

  /** The id of the comment about to be deleted */
  export let deletingId = "";

  /** Set to `true` to show every reply of a long thread */
  export let repliesExpanded = false;

  /** Set to `true` to show every event of a long group */
  export let eventsExpanded = false;

  import { getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
  import ActivityComment from "./ActivityComment.svelte";
  import ActivityComposer from "./ActivityComposer.svelte";
  import ActivityEvents from "./ActivityEvents.svelte";
  import { ACTIVITY_FEED_CONTEXT } from "./activity-context.js";
  import { dayLabel, hiddenReplyCount, itemTime } from "./activity-feed.js";

  /** @type {import("svelte/store").Readable<import("./activity-context.js").ActivityConfig>} */
  const config = getContext(ACTIVITY_FEED_CONTEXT);

  /** @type {undefined | ActivityComposer} */
  let replyComposer;
  let wasReplying = false;
  /** @type {null | HTMLButtonElement} */
  let replyButton = null;

  $: ({
    user,
    texts,
    now,
    locale,
    timeZone,
    mentionItems,
    draftKey,
    replyLimit,
    handlers,
  } = $config);
  $: item = row.item;
  $: replies = item.replies ?? [];
  $: hiddenReplies = hiddenReplyCount(replies.length, replyLimit);
  $: shownReplies =
    repliesExpanded || hiddenReplies === 0
      ? replies
      : replies.slice(hiddenReplies);
  $: replying = replyingId === item.id;
  $: absolute = getDateTimeFormatter(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(itemTime(item));
  $: label =
    row.type === "comment"
      ? texts.commentLabel(item.author.name, absolute)
      : texts.eventsLabel(
          [...new Set(row.events.map((event) => event.author.name))].join(", "),
          absolute,
        );
  $: heading = row.day ? dayLabel(row.day, { now, locale, timeZone }) : "";
  $: canReply = Boolean(user) && item.status === undefined;

  $: if (replying !== wasReplying) {
    wasReplying = replying;
    tick().then(() =>
      replying ? replyComposer?.focus() : replyButton?.focus(),
    );
  }
</script>

<!-- APG feed: every article is a tab stop, and PageUp and PageDown move
     between them. -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<article
  class:bx--activity-row={true}
  tabindex="0"
  aria-label={label}
  aria-posinset={posinset}
  aria-setsize={setsize}
  data-activity-key={row.key}
>
  {#if heading}
    <!-- The day is also in each article's name, so the divider is drawn only. -->
    <div class:bx--chat-divider={true} aria-hidden="true">
      <span class:bx--chat-divider__label={true}>{heading}</span>
    </div>
  {/if}
  {#if row.type === "comment"}
    <ActivityComment
      {item}
      editing={editingId === item.id}
      confirmingDelete={deletingId === item.id}
    />
    {#if replies.length > 0 || replying || canReply}
      <div class:bx--activity-thread={true}>
        {#if hiddenReplies > 0}
          <Button
            kind="ghost"
            size="sm"
            aria-expanded={repliesExpanded ? "true" : "false"}
            on:click={() => handlers.toggleReplies(item.id)}
            >{repliesExpanded
              ? texts.hideReplies
              : texts.showReplies(hiddenReplies)}</Button
          >
        {/if}
        {#if replies.length > 0}
          <ul
            class:bx--activity-thread__replies={true}
            aria-label={texts.replyCount(replies.length)}
          >
            {#each shownReplies as replyItem (replyItem.clientId ?? replyItem.id)}
              <li>
                <ActivityComment
                  reply
                  item={replyItem}
                  editing={editingId === replyItem.id}
                  confirmingDelete={deletingId === replyItem.id}
                />
              </li>
            {/each}
          </ul>
        {/if}
        {#if replying}
          <ActivityComposer
            bind:this={replyComposer}
            class="bx--activity-thread__composer"
            labelText={texts.replyLabel(item.author.name)}
            placeholder={texts.replyLabel(item.author.name)}
            submitText={texts.reply}
            cancelText={texts.cancel}
            cancelable
            {mentionItems}
            draftKey={draftKey ? `${draftKey}:reply:${item.id}` : undefined}
            on:submit={(event) =>
              handlers.submitReply(item.id, event.detail.body)}
            on:cancel={handlers.cancelReply}
          />
        {:else if canReply}
          <Button
            kind="ghost"
            size="sm"
            bind:ref={replyButton}
            on:click={() => handlers.startReply(item.id)}>{texts.reply}</Button
          >
        {/if}
      </div>
    {/if}
  {:else}
    <ActivityEvents
      events={row.events}
      groupKey={row.key}
      expanded={eventsExpanded}
    />
  {/if}
</article>
