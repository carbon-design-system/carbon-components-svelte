<script>
  import {
    Header,
    HeaderAction,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
  } from "carbon-components-svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
</script>

<Header companyName="E2E" platformName="Header actions">
  <HeaderUtilities>
    <HeaderAction iconDescription="Notifications" icon={Notification}>
      <HeaderPanelLinks>
        <HeaderPanelLink href="#">Notification</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction iconDescription="Help" icon={Help}>
      <HeaderPanelLinks>
        <HeaderPanelLink href="#">Documentation</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction text="IBM Cloud">
      <HeaderPanelLinks>
        <HeaderPanelLink href="#">Watson Studio</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>
