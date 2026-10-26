<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import UserAvatarGroup from "carbon-components-svelte/UserAvatarGroup/UserAvatarGroup.svelte";

  export let max = 2;
  export let total: number | undefined = undefined;
</script>

<UserAvatarGroup {max} {total}>
  <UserAvatar name="Ada Lovelace" />
  <UserAvatar name="Grace Hopper" />
  <UserAvatar name="Alan Turing" />
  <UserAvatar name="Katherine Johnson" />
</UserAvatarGroup>
