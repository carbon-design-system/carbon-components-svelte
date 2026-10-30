<script>
  import {
    BadgeIndicator,
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderUtilities,
    NotificationsPanel,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";

  const HOUR = 3_600_000;
  const now = Date.now();

  /** @type {import("carbon-components-svelte/NotificationsPanel/NotificationsPanel.svelte").PanelNotification[]} */
  let notifications = [
    {
      id: "1",
      kind: "error",
      title: "Build #482 failed",
      subtitle: "The checkout service did not pass its tests.",
      timestamp: now - HOUR,
      unread: true,
    },
    {
      id: "2",
      kind: "success",
      title: "Deployment finished",
      timestamp: now - 3 * HOUR,
      unread: true,
    },
    {
      id: "3",
      kind: "info",
      title: "Your invoice is ready",
      timestamp: now - 30 * HOUR,
      href: "#invoice",
    },
    {
      id: "4",
      kind: "warning",
      title: "Certificate expires soon",
      subtitle: "Renew it before the end of the month.",
      timestamp: now - 6 * 24 * HOUR,
    },
  ];

  let doNotDisturb = false;

  $: unread = notifications.filter((n) => n.unread).length;
</script>

<Header companyName="IBM" platformName="Cloud" theme="classic">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderUtilities style="--ccs-header-panel-width: 22rem">
    <HeaderAction
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
        doNotDisturbLabelText="Do not disturb"
        bind:doNotDisturb
        viewAllText="View all"
        viewAllHref="#all"
        on:click:notification={({ detail }) => {
          notifications = notifications.map((n) =>
            n.id === detail.id ? { ...n, unread: false } : n,
          );
        }}
        on:dismiss={({ detail }) => {
          notifications = notifications.filter((n) => n.id !== detail.id);
        }}
        on:dismiss:all={() => (notifications = [])}
      />
    </HeaderAction>
  </HeaderUtilities>
</Header>

<Content>
  <Grid>
    <Row>
      <Column><h1>Dashboard</h1></Column>
    </Row>
  </Grid>
</Content>
