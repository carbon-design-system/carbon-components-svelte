<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import UserAvatarGroup from "carbon-components-svelte/UserAvatarGroup/UserAvatarGroup.svelte";

  export let names: string[] = [];
  export let max = 0;
  export let gap: string | undefined = undefined;
  export let stackOrder: "first" | "last" = "last";
  export let style: string | undefined = undefined;
</script>

<UserAvatarGroup {max} {gap} {stackOrder} {style}>
  {#each names as name}
    <UserAvatar {name} initials={name} />
  {/each}
</UserAvatarGroup>
