<script lang="ts">
  import ProfileMenuHeader from "carbon-components-svelte/UIShell/ProfileMenuHeader.svelte";
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
</script>

<ProfileMenuHeader
  data-testid="default"
  name="Richard Hendricks"
  username="rhendricks"
  href="/"
/>

<ProfileMenuHeader
  data-testid="custom"
  name="Richard Hendricks"
  username="rhendricks"
  href="/"
  text="Manage account"
/>

<ProfileMenuHeader
  data-testid="hidden"
  name="Richard Hendricks"
  username="rhendricks"
  href="/"
  text=""
/>

<ProfileMenuHeader
  data-testid="with-avatar"
  name="Ada Lovelace"
  username="alovelace"
  href="/"
  text=""
>
  <svelte:fragment slot="avatar">
    <UserAvatar name="Ada Lovelace" size="lg" />
  </svelte:fragment>
</ProfileMenuHeader>
