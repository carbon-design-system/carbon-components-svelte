<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
</script>

<InlineNotification
  id="inline"
  actionable
  title="Saved"
  subtitle="Your changes are live."
/>
<ToastNotification
  id="toast"
  actionable
  title="Saved"
  subtitle="Your changes are live."
/>
<HeaderSwitcher id="switcher" isOpen text="Products" />
<ProfileMenu id="profile" isOpen />
