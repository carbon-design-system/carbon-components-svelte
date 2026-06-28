<script lang="ts">
  import ProfileMenuHeader from "carbon-components-svelte/UIShell/ProfileMenuHeader.svelte";
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
