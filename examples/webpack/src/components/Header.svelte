<script>
  import {
    SkipToContent,
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
  } from "carbon-components-svelte";
  import Notification20 from "carbon-icons-svelte/lib/Notification20";
  import UserAvatar20 from "carbon-icons-svelte/lib/UserAvatar20";
  import AppSwitcher20 from "carbon-icons-svelte/lib/AppSwitcher20";
</script>

<Header company="IBM" platformName="Carbon Components Svelte" href="/">
  <div slot="skip-to-content">
    <SkipToContent />
  </div>
  <HeaderUtilities>
    <HeaderGlobalAction aria-label="Notifications" icon="{Notification20}" />
    <HeaderGlobalAction aria-label="User Avatar" icon="{UserAvatar20}" />
    <HeaderGlobalAction aria-label="App Switcher" icon="{AppSwitcher20}" />
  </HeaderUtilities>
</Header>
