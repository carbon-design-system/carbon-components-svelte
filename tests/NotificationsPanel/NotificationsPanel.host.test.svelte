<script lang="ts">
  import NotificationsPanel from "carbon-components-svelte/NotificationsPanel/NotificationsPanel.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";

  export let isOpen = true;
  export let closeTriggers: string[] = [];
  export let prevent = false;

  const notifications = [
    {
      id: "link",
      title: "Open the report",
      timestamp: Date.UTC(2026, 9, 27, 14),
      href: "#report",
    },
    {
      id: "plain",
      title: "A button row",
      timestamp: Date.UTC(2026, 9, 27, 13),
    },
  ];
</script>

<HeaderAction
  bind:isOpen
  iconDescription="Notifications"
  on:close={(event) =>
    (closeTriggers = [...closeTriggers, event.detail.trigger])}
>
  <NotificationsPanel
    {notifications}
    now={Date.UTC(2026, 9, 27, 15)}
    viewAllText="View all"
    viewAllHref="#all"
    on:click:notification={(event) => prevent && event.preventDefault()}
  />
</HeaderAction>
<p data-testid="triggers">{closeTriggers.join(",")}</p>
