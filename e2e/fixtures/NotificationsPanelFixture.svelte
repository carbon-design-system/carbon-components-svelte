<script>
  import {
    BadgeIndicator,
    Button,
    Content,
    Header,
    HeaderAction,
    HeaderUtilities,
    NotificationsPanel,
    SkipToContent,
  } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  // `?count=200` sets the size, `?open` opens the panel, `?plain` renders
  // the panel on the page and `?empty` starts with none.
  const params = new URLSearchParams(location.search);
  const count = params.has("empty") ? 0 : Number(params.get("count") ?? 12);
  const plain = params.has("plain");

  const now = Date.UTC(2026, 9, 27, 15, 0, 0);
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;
  const kinds = [
    "error",
    "warning",
    "success",
    "info",
    "info-square",
    "warning-alt",
  ];

  function timestamp(index) {
    if (index < 5) return now - (index + 1) * HOUR;
    if (index < 9) return now - DAY - (index - 4) * HOUR;
    return now - (index - 5) * DAY;
  }

  let notifications = Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    kind: kinds[index % kinds.length],
    title: `Notification ${index + 1}`,
    subtitle:
      index % 3 === 0
        ? "Deployment of the checkout service finished with warnings"
        : undefined,
    caption: index === 4 ? "Run 42" : undefined,
    timestamp: timestamp(index),
    unread: index % 3 === 0,
    dismissible: index !== 2,
    href: index === 1 ? "#row-link" : undefined,
    action:
      index === 3 ? { label: "Retry", onClick: () => log("retry") } : undefined,
  }));

  let isOpen = params.has("open");
  let doNotDisturb = false;
  let events = [];

  $: unread = notifications.filter((item) => item.unread).length;

  function log(name) {
    events = [...events, name];
  }

  function handleDismiss(event) {
    log(`dismiss:${event.detail.id}`);
    notifications = notifications.filter((item) => item.id !== event.detail.id);
  }

  function handleDismissAll() {
    log("dismiss:all");
    notifications = [];
  }

  let arrivals = 0;

  function addArrival() {
    arrivals += 1;
    notifications = [
      {
        id: `new${arrivals}`,
        kind: "info",
        title: `New notification ${arrivals}`,
        timestamp: now - 60_000,
        unread: true,
      },
      ...notifications,
    ];
  }

  // Called from tests: a click anywhere outside the panel would close it.
  window.addNotification = addArrival;

  function handleClick(event) {
    log(`click:${event.detail.id}`);
  }
</script>

{#if plain}
  <div style:width="22rem" style:height="32rem">
    <NotificationsPanel
      {notifications}
      {now}
      timeZone="UTC"
      locale="en"
      viewAllText="View all"
      on:dismiss={handleDismiss}
      on:dismiss:all={handleDismissAll}
      on:click:notification={handleClick}
    />
  </div>
{:else}
  <Header companyName="E2E" platformName="Notifications" theme="classic">
    <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
    <HeaderUtilities style="--ccs-header-panel-width: 22rem">
      <HeaderAction
        bind:isOpen
        iconDescription="Notifications ({unread} unread)"
        tooltipAlignment="end"
      >
        <svelte:fragment slot="icon">
          <span class="bx--btn__badge-wrapper">
            <Notification size={20} />
            {#if unread > 0}<BadgeIndicator count={unread} />{/if}
          </span>
        </svelte:fragment>
        <NotificationsPanel
          {notifications}
          {now}
          timeZone="UTC"
          locale="en"
          doNotDisturbLabelText="Do not disturb"
          bind:doNotDisturb
          viewAllText="View all"
          on:dismiss={handleDismiss}
          on:dismiss:all={handleDismissAll}
          on:click:notification={handleClick}
          on:view:all={() => log("view:all")}
        >
          <Button
            slot="actions"
            kind="ghost"
            size="sm"
            iconDescription="Settings"
            icon={Settings}
            tooltipPosition="bottom"
            tooltipAlignment="end"
            on:click={() => log("settings")}
          />
        </NotificationsPanel>
      </HeaderAction>
    </HeaderUtilities>
  </Header>
  <Content>
    <a href="#after" data-testid="after">After the header</a>
  </Content>
{/if}

<p class="bx--visually-hidden" data-testid="events">{events.join(",")}</p>
<p class="bx--visually-hidden" data-testid="dnd">{doNotDisturb}</p>
