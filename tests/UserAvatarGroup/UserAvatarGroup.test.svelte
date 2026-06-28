<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import UserAvatarGroup from "carbon-components-svelte/UserAvatarGroup/UserAvatarGroup.svelte";

  // Toggles a leading avatar to exercise DOM-order resync: the avatar mounts
  // last but renders first.
  let showLead = false;
</script>

<div data-testid="under-max">
  <UserAvatarGroup max={5}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
    <UserAvatar name="Dinesh Chugtai" />
  </UserAvatarGroup>
</div>

<div data-testid="overflow">
  <UserAvatarGroup max={2}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
    <UserAvatar name="Dinesh Chugtai" />
    <UserAvatar name="Bertram Gilfoyle" />
  </UserAvatarGroup>
</div>

<div data-testid="no-limit">
  <UserAvatarGroup max={0}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
    <UserAvatar name="Dinesh Chugtai" />
  </UserAvatarGroup>
</div>

<div data-testid="spaced">
  <UserAvatarGroup gap={3}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
  </UserAvatarGroup>
</div>

<div data-testid="tighter">
  <UserAvatarGroup gap="-1rem">
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
  </UserAvatarGroup>
</div>

<div data-testid="total">
  <UserAvatarGroup max={3} total={250}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" />
    <UserAvatar name="Dinesh Chugtai" />
  </UserAvatarGroup>
</div>

<div data-testid="overflow-tooltip">
  <UserAvatarGroup
    max={1}
    total={10}
    overflowTooltipText="Gilfoyle, Jared, and 8 others"
  >
    <UserAvatar name="Monica" />
  </UserAvatarGroup>
</div>

<div data-testid="cascade">
  <UserAvatarGroup size="lg" max={1}>
    <UserAvatar name="Monica" />
    <UserAvatar name="Richard Hendricks" size="sm" />
  </UserAvatarGroup>
</div>

<button
  type="button"
  data-testid="toggle-lead"
  on:click={() => (showLead = !showLead)}
>
  toggle
</button>
<div data-testid="resync">
  <UserAvatarGroup max={1}>
    {#if showLead}
      <UserAvatar name="Alice" initials="A1" />
    {/if}
    <UserAvatar name="Bob" initials="B2" />
    <UserAvatar name="Cara" initials="C3" />
  </UserAvatarGroup>
</div>
