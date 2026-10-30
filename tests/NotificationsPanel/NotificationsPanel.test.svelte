<svelte:options accessors />

<script lang="ts">
  import NotificationsPanel, {
    type PanelNotification,
  } from "carbon-components-svelte/NotificationsPanel/NotificationsPanel.svelte";

  type Item = PanelNotification;

  export let notifications: Item[] = [];
  /** Remove a row in the `dismiss` handler, as a consumer would. */
  export let remove = true;
  export let doNotDisturbLabelText = "";
  export let doNotDisturb = false;
  export let doNotDisturbOffText = "Off";
  export let doNotDisturbOnText = "On";
  export let viewAllText = "";
  export let grouped = true;
  export let interactive = true;
  export let arrivalDescription:
    ((added: Item[]) => string) | null | undefined = undefined;
  export let events: string[] = [];

  const now = Date.UTC(2026, 9, 27, 15, 0, 0);

  function handleDismiss(event: CustomEvent<{ notification: Item }>) {
    events = [...events, `dismiss:${event.detail.notification.id}`];
    if (remove) {
      notifications = notifications.filter(
        (item) => item.id !== event.detail.notification.id,
      );
    }
  }
</script>

<button type="button" data-testid="outside">Outside</button>
<NotificationsPanel
  {notifications}
  {now}
  locale="en"
  timeZone="UTC"
  {doNotDisturbLabelText}
  bind:doNotDisturb
  {doNotDisturbOffText}
  {doNotDisturbOnText}
  {viewAllText}
  {grouped}
  {interactive}
  {...arrivalDescription === undefined ? {} : { arrivalDescription }}
  on:dismiss={handleDismiss}
  on:dismiss:all={() => {
    events = [...events, "dismiss:all"];
    if (remove) notifications = [];
  }}
  on:click:notification={(event) =>
    (events = [...events, `click:${event.detail.notification.id}`])}
  on:view:all={() => (events = [...events, "view:all"])}
/>
<p data-testid="events">{events.join(",")}</p>
<p data-testid="dnd">{doNotDisturb}</p>
