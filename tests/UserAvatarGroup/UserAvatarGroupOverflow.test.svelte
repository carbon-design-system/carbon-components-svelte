<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import UserAvatarGroup from "carbon-components-svelte/UserAvatarGroup/UserAvatarGroup.svelte";

  export let interactiveOverflow = false;
  /** Without names, the "+N" chip has no names tooltip. */
  export let named = true;
  export let withSlot = false;
  export let onOverflowClick: (
    event: CustomEvent<{ hidden: { id: string; name: string }[] }>,
  ) => void = () => {};

  const people = ["Monica", "Richard Hendricks", "Dinesh", "Bertram"];
</script>

<UserAvatarGroup
  max={2}
  {interactiveOverflow}
  on:click:overflow={onOverflowClick}
>
  {#each people as person (person)}
    <UserAvatar
      name={named ? person : undefined}
      initials={named ? undefined : person.slice(0, 2)}
    />
  {/each}
  <svelte:fragment slot="overflow" let:hidden>
    {#if withSlot}
      <ul data-testid="overflow-members">
        {#each hidden as member (member.id)}
          <li>{member.name}</li>
        {/each}
      </ul>
    {/if}
  </svelte:fragment>
</UserAvatarGroup>
