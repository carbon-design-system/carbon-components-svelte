<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";

  export let onClick: () => void = () => {};
</script>

<div data-testid="no-badge">
  <HeaderGlobalAction
    iconDescription="Notifications"
    icon={Notification}
    on:click={onClick}
  />
</div>

<div data-testid="dot">
  <HeaderGlobalAction
    iconDescription="Notifications"
    icon={Notification}
    on:click={onClick}
  >
    <BadgeIndicator slot="badge" count={0} />
  </HeaderGlobalAction>
</div>
