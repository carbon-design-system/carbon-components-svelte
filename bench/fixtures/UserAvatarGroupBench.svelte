<svelte:options accessors />

<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import UserAvatarGroup from "carbon-components-svelte/UserAvatarGroup/UserAvatarGroup.svelte";

  export let count = 100;
  export let max = 0;
  export let stackOrder = "last";
</script>

<UserAvatarGroup {max} {stackOrder}>
  {#each { length: count } as _, i}
    <UserAvatar name={`Person ${i}`} />
  {/each}
</UserAvatarGroup>
