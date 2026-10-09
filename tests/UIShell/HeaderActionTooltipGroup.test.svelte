<script lang="ts">
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
</script>

<HeaderUtilities>
  <HeaderAction iconDescription="Notifications" icon={Notification} />
  <HeaderAction iconDescription="Help" icon={Help} />
  <HeaderGlobalAction iconDescription="Settings" icon={Settings} />
</HeaderUtilities>
