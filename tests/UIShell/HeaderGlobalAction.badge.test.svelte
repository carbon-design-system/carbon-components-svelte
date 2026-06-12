<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
</script>

<div data-testid="no-badge">
  <HeaderGlobalAction iconDescription="Notifications" icon={Notification} />
</div>

<div data-testid="dot">
  <HeaderGlobalAction iconDescription="Notifications" icon={Notification}>
    <BadgeIndicator slot="badge" count={0} />
  </HeaderGlobalAction>
</div>

<div data-testid="count">
  <HeaderGlobalAction iconDescription="Notifications" icon={Notification}>
    <BadgeIndicator slot="badge" count={4} />
  </HeaderGlobalAction>
</div>
