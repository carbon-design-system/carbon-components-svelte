<script>
  /**
   * @restProps {div}
   * @slot {{}} actions - Controls beside "Dismiss all" in the header, such as a settings button.
   * @slot {{}} empty - Replaces `emptyText` when there are no notifications.
   * @slot {{ notification: PanelNotification }} notification - Replaces the text of a row. Keep it to non-interactive content: it sits inside the row's button or link.
   */

  /**
   * @typedef {object} PanelNotification
   * @property {string} id - Stable across updates, so the row keeps its focus and state
   * @property {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"} [kind] - Defaults to `"info"`
   * @property {string} [statusIconDescription] - Names the status icon. Defaults to the English name of `kind`, such as "Warning"
   * @property {string} title
   * @property {string} [subtitle]
   * @property {string} [caption] - Replaces the relative time, for example "Run 42"
   * @property {Date | number | string} timestamp - Decides the group and the relative time
   * @property {boolean} [unread]
   * @property {boolean} [dismissible] - Set to `false` to hide the dismiss button. Defaults to `true`
   * @property {string} [href] - Render the row as a link. In a `HeaderAction`, activating it closes the panel
   * @property {{ label: string, href?: string, onClick?: (event: MouseEvent) => void }} [action] - Same shape as the `NotificationQueue` action
   */

  /**
   * @event click:notification
   * @type {object}
   * @property {string} id
   * @property {PanelNotification} item
   */

  /**
   * @event dismiss
   * @type {object}
   * @property {string} id
   * @property {PanelNotification} item
   */

  /** @event dismiss:all */

  /** @event view:all */

  /**
   * Specify the notifications, in any order. The panel never sorts or
   * changes the array: remove an item in your `dismiss` handler.
   * @type {ReadonlyArray<PanelNotification>}
   */
  export let notifications = [];

  /** Specify the heading. It also names the panel. */
  export let titleText = "Notifications";

  /** Set to `false` to render one list instead of grouping by recency. */
  export let grouped = true;

  /**
   * Override the group headings. "Today" and "Yesterday" follow `locale`.
   * @type {{ today?: string, yesterday?: string, previous?: string }}
   */
  export let groupLabels = {};

  /**
   * Fix the reference time, which turns the live relative times off. Set
   * it with `timeZone` when you render on the server, so the server and the
   * client agree on the groups.
   * @type {Date | number | undefined}
   */
  export let now = undefined;

  /**
   * Specify the locale of the group headings and the relative times.
   * Defaults to the runtime locale.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the IANA time zone that decides where a day starts. Defaults to
   * the runtime time zone.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /** Set to `false` to render the rows as static text, not buttons. */
  export let interactive = true;

  /** Specify the "Dismiss all" text. Set to `""` to hide it. */
  export let dismissAllText = "Dismiss all";

  /** Specify the dismiss button label. The notification title follows it. */
  export let dismissDescription = "Dismiss notification";

  /** Specify the text that marks an unread row for screen readers. */
  export let unreadDescription = "Unread";

  /** Specify the text shown when there are no notifications. */
  export let emptyText = "You're all caught up";

  /**
   * Set to `true` when Do Not Disturb is on. Only the toggle state: your
   * app decides what it silences.
   * @bindable writable
   */
  export let doNotDisturb = false;

  /** Specify the Do Not Disturb label. Setting it shows the toggle. */
  export let doNotDisturbLabelText = "";

  /** Specify the toggle's text when Do Not Disturb is off. */
  export let doNotDisturbOffText = "Off";

  /** Specify the toggle's text when Do Not Disturb is on. */
  export let doNotDisturbOnText = "On";

  /** Specify the "View all" text. Set it to show the footer button. */
  export let viewAllText = "";

  /** Specify a link for "View all". Without it, the button dispatches `view:all`. */
  export let viewAllHref = "";

  /**
   * Specify the text a screen reader announces when notifications arrive
   * while the panel is open. Set to `null` to turn announcements off.
   * @type {((added: PanelNotification[]) => string) | null}
   */
  export let arrivalDescription = defaultArrivalDescription;

  /** Set an id for the panel. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the panel element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import NotificationIcon from "../Notification/NotificationIcon.svelte";
  import { statusIconLabel } from "../Notification/status-icon-label.js";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import Close from "../icons/Close.svelte";
  import { debounce } from "../utils/debounce.js";
  import { focusQuietly } from "../utils/focus.js";
  import { groupNotificationsByRecency } from "../utils/group-notifications.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { verticalListFocus } from "../utils/vertical-list-focus.js";

  /** Time (ms) to wait for more arrivals before announcing them together. */
  const ANNOUNCE_DELAY_MS = 300;

  const dispatch = createEventDispatcher();
  const host = getContext("carbon:HeaderAction");
  // Inside a `HeaderAction`, its panel is already a labelled region. A
  // second one with the same name is a duplicate landmark.

  /** @param {PanelNotification[]} added */
  function defaultArrivalDescription(added) {
    return added.length === 1
      ? added[0].title
      : `${added.length} new notifications`;
  }

  /** @type {null | HTMLHeadingElement} */
  let headingRef = null;
  let announcement = "";
  /** @type {Set<string> | null} */
  let prevIds = null;
  /** @type {PanelNotification[]} */
  let arrivals = [];
  // While a pointer that can hover rests on the rows, they hold still: a new
  // row waits, and a removed row leaves a hidden space of its own height.
  let holding = false;
  /** @type {ReadonlyArray<PanelNotification>} */
  let heldItems = [];

  const flushAnnouncement = debounce(() => {
    const added = arrivals;
    arrivals = [];
    announcement = arrivalDescription ? arrivalDescription(added) : "";
  }, ANNOUNCE_DELAY_MS);

  $: byId = new Map(notifications.map((item) => [item.id, item]));
  // A held row shows its latest data. One that is gone keeps its last data
  // and renders hidden.
  $: shown = holding
    ? heldItems.map((item) => byId.get(item.id) ?? item)
    : notifications;

  $: groups = grouped
    ? groupNotificationsByRecency(shown, {
        now,
        locale,
        timeZone,
        labels: groupLabels,
      })
    : [{ key: "all", label: "", items: [...shown] }];

  // Intl text is written for its own locale's direction, so an English time
  // reads "1 hr. ago" on an RTL page.
  $: timeDirection = localeDirection(locale);

  // Arrivals only: the first render and removals stay silent. Ids are
  // compared, so a changed row (a read one) is not an arrival.
  $: trackArrivals(notifications);

  /** @param {ReadonlyArray<PanelNotification>} items */
  function trackArrivals(items) {
    const ids = new Set(items.map((item) => item.id));
    const previous = prevIds;
    prevIds = ids;
    if (!previous || !arrivalDescription) return;
    const added = items.filter((item) => !previous.has(item.id));
    if (added.length === 0) return;
    arrivals = [...arrivals, ...added];
    // Clear first, so the same text announces again.
    announcement = "";
    flushAnnouncement();
  }

  onMount(() => flushAnnouncement.cancel);

  const LIVE_ROW =
    ".bx--notifications-panel__item:not(.bx--notifications-panel__item--held)";

  function rowElements() {
    return ref
      ? /** @type {HTMLElement[]} */ (
          Array.from(ref.querySelectorAll(LIVE_ROW))
        )
      : [];
  }

  /** @param {PointerEvent} event */
  function handlePointerMove(event) {
    if (holding || event.pointerType === "touch") return;
    heldItems = notifications;
    holding = true;
  }

  /**
   * A press on a held row's space lands on its list. Keep focus where the
   * dismissal put it, and select no text, as a second click of a double
   * click would.
   * @param {MouseEvent} event
   */
  function handleMouseDown(event) {
    if (
      event.target instanceof Element &&
      event.target.classList.contains("bx--notifications-panel__list")
    ) {
      event.preventDefault();
    }
  }

  function release() {
    if (!holding) return;
    holding = false;
    heldItems = [];
  }

  /**
   * Put focus on the row that took the place of a removed one. Moves it only
   * when it was lost, so a consumer that keeps the row, or sends focus
   * elsewhere, is left alone.
   * @param {HTMLElement | null} row
   * @param {boolean} viaDismissButton
   */
  async function restoreFocus(row, viaDismissButton) {
    if (!row) return;
    const index = rowElements().indexOf(row);
    await tick();
    const gone =
      !row.isConnected ||
      row.classList.contains("bx--notifications-panel__item--held");
    if (!gone) return;
    const active = document.activeElement;
    if (active && active !== document.body && !row.contains(active)) return;
    const rows = rowElements();
    const next = rows[Math.min(index, rows.length - 1)];
    const control =
      next?.querySelector(
        viaDismissButton
          ? ".bx--notifications-panel__dismiss"
          : ".bx--notifications-panel__main",
      ) ?? next?.querySelector("button, a");
    if (control instanceof HTMLElement) focusQuietly(control);
    else if (headingRef) focusQuietly(headingRef);
  }

  /**
   * @param {PanelNotification} notification
   * @param {HTMLElement | null} row
   * @param {boolean} viaDismissButton
   */
  function dismiss(notification, row, viaDismissButton) {
    const hadFocus = !!row?.contains(document.activeElement);
    dispatch("dismiss", { id: notification.id, item: notification });
    if (hadFocus) restoreFocus(row, viaDismissButton);
  }

  async function dismissAll() {
    const hadFocus = !!ref?.contains(document.activeElement);
    dispatch("dismiss:all");
    if (!hadFocus) return;
    await tick();
    const active = document.activeElement;
    if (headingRef && (!active || active === document.body)) {
      focusQuietly(headingRef);
    }
  }

  // Typed: an inline arrow on `<svelte:element>` gets no event type, and a
  // handler factory call there does not attach under Svelte 3.
  /** @param {MouseEvent & { currentTarget: HTMLElement }} event */
  function handleMainClick(event) {
    const notification = byId.get(
      event.currentTarget.closest("li")?.dataset.id ?? "",
    );
    if (notification) handleClick(notification, event);
  }

  /**
   * @param {PanelNotification} notification
   * @param {MouseEvent} event
   */
  function handleClick(notification, event) {
    const proceed = dispatch(
      "click:notification",
      { id: notification.id, item: notification },
      { cancelable: true },
    );
    if (!proceed) event.preventDefault();
    else if (notification.href) host?.select();
  }

  /**
   * @param {PanelNotification} notification
   * @param {MouseEvent} event
   */
  function handleActionClick(notification, event) {
    notification.action?.onClick?.(event);
    if (notification.action?.href && !event.defaultPrevented) host?.select();
  }

  /**
   * @param {PanelNotification} notification
   * @param {MouseEvent & { currentTarget: HTMLButtonElement }} event
   */
  function handleDismissClick(notification, event) {
    dismiss(notification, event.currentTarget.closest("li"), true);
  }

  /**
   * Delete or Backspace on a row dismisses it, as in an email inbox.
   * @param {PanelNotification} notification
   * @param {KeyboardEvent} event
   */
  function handleRowKeydown(notification, event) {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (notification.dismissible === false) return;
    if (event.defaultPrevented || hasModifierKey(event)) return;
    if (isImeComposition(event)) return;
    event.preventDefault();
    dismiss(
      notification,
      /** @type {HTMLElement} */ (event.currentTarget),
      event.target instanceof Element &&
        !!event.target.closest(".bx--notifications-panel__dismiss"),
    );
  }

  /** @param {MouseEvent} event */
  function handleViewAll(event) {
    const proceed = dispatch("view:all", null, { cancelable: true });
    if (!proceed) event.preventDefault();
    else if (viewAllHref) host?.select();
  }
</script>

<div
  bind:this={ref}
  {id}
  role={host ? undefined : "region"}
  aria-labelledby={host || $$restProps["aria-label"]
    ? undefined
    : `${id}-heading`}
  class:bx--notifications-panel={true}
  {...$$restProps}
  on:click
  on:keydown
>
  <div class:bx--notifications-panel__header={true}>
    <h2
      bind:this={headingRef}
      id="{id}-heading"
      tabindex="-1"
      class:bx--notifications-panel__heading={true}
    >
      {titleText}
    </h2>
    {#if dismissAllText && notifications.length > 0}
      <Button kind="ghost" size="sm" on:click={dismissAll}>
        {dismissAllText}
      </Button>
    {/if}
    <slot name="actions" />
  </div>
  {#if doNotDisturbLabelText}
    <div class:bx--notifications-panel__dnd={true}>
      <Toggle
        size="sm"
        labelText={doNotDisturbLabelText}
        labelA={doNotDisturbOffText}
        labelB={doNotDisturbOnText}
        bind:toggled={doNotDisturb}
      />
    </div>
  {/if}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    use:verticalListFocus={{
      selector: `${LIVE_ROW} .bx--notifications-panel__main`,
    }}
    class:bx--notifications-panel__body={true}
    on:pointermove={handlePointerMove}
    on:pointerleave={release}
    on:mousedown={handleMouseDown}
    on:scroll={release}
  >
    {#if shown.length === 0}
      <div class:bx--notifications-panel__empty={true}>
        <slot name="empty">{emptyText}</slot>
      </div>
    {:else}
      {#each groups as group (group.key)}
        {#if grouped}
          <h3
            id="{id}-group-{group.key}"
            class:bx--notifications-panel__group-heading={true}
          >
            {group.label}
          </h3>
        {/if}
        <ul
          aria-labelledby={grouped
            ? `${id}-group-${group.key}`
            : `${id}-heading`}
          class:bx--notifications-panel__list={true}
        >
          {#each group.items as notification (notification.id)}
            {@const kind = notification.kind ?? "info"}
            {@const tag = interactive
              ? notification.href
                ? "a"
                : "button"
              : "div"}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
              data-id={notification.id}
              class:bx--notifications-panel__item={true}
              class:bx--notifications-panel__item--unread={notification.unread}
              class:bx--notifications-panel__item--interactive={interactive}
              class:bx--notifications-panel__item--held={!byId.has(
                notification.id,
              )}
              aria-hidden={byId.has(notification.id) ? undefined : "true"}
              on:keydown={(event) => handleRowKeydown(notification, event)}
            >
              <div class:bx--notifications-panel__icon={true}>
                <NotificationIcon
                  {kind}
                  notificationType="inline"
                  lowContrast
                  iconDescription={notification.statusIconDescription ||
                    statusIconLabel(kind)}
                />
              </div>
              <div class:bx--notifications-panel__content={true}>
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <svelte:element
                  this={tag}
                  href={tag === "a" ? notification.href : undefined}
                  type={tag === "button" ? "button" : undefined}
                  class:bx--notifications-panel__main={true}
                  on:click={handleMainClick}
                >
                  {#if notification.unread}
                    <span class:bx--visually-hidden={true}>
                      {unreadDescription}
                    </span>
                  {/if}
                  <slot {notification} name="notification">
                    <span class:bx--notifications-panel__title={true}>
                      {notification.title}
                    </span>
                    {#if notification.subtitle}
                      <span class:bx--notifications-panel__subtitle={true}>
                        {notification.subtitle}
                      </span>
                    {/if}
                  </slot>
                  <span class:bx--notifications-panel__caption={true}>
                    {#if notification.caption}
                      {notification.caption}
                    {:else}
                      <bdi dir={timeDirection}>
                        <RelativeTime
                          date={notification.timestamp}
                          {now}
                          {locale}
                          {timeZone}
                          style="short"
                        />
                      </bdi>
                    {/if}
                  </span>
                </svelte:element>
                {#if notification.action}
                  <div class:bx--notifications-panel__action={true}>
                    <Button
                      kind="ghost"
                      size="sm"
                      href={notification.action.href}
                      on:click={(event) =>
                        handleActionClick(notification, event)}
                    >
                      {notification.action.label}
                    </Button>
                  </div>
                {/if}
              </div>
              {#if notification.dismissible !== false}
                <button
                  type="button"
                  aria-label="{dismissDescription}: {notification.title}"
                  class:bx--notifications-panel__dismiss={true}
                  on:click={(event) => handleDismissClick(notification, event)}
                >
                  <Close size={16} />
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    {/if}
  </div>
  {#if viewAllText}
    <div class:bx--notifications-panel__footer={true}>
      <Button
        kind="ghost"
        size="sm"
        href={viewAllHref || undefined}
        on:click={handleViewAll}
      >
        {viewAllText}
      </Button>
    </div>
  {/if}
  <div role="status" class:bx--visually-hidden={true}>{announcement}</div>
</div>
