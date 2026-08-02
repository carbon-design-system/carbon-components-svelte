<script>
  import {
    Popover,
    Stack,
    UserAvatar,
    UserAvatarGroup,
  } from "carbon-components-svelte";

  let open = false;
  /** @type {{ id: string; name: string }[]} */
  let hidden = [];

  const members = [
    "Monica",
    "Richard Hendricks",
    "Dinesh Chugtai",
    "Bertram Gilfoyle",
    "Jared Dunn",
    "Erlich Bachman",
  ];
</script>

<div style:position="relative" style:display="inline-block">
  <UserAvatarGroup
    max={3}
    on:click:overflow={({ detail }) => {
      hidden = detail.hidden;
      open = !open;
    }}
  >
    {#each members as name}
      <UserAvatar backgroundColor="auto" {name} tooltipText={name} />
    {/each}
    <Popover slot="overflow" bind:open align="bottom" caret>
      <Stack gap={3} style:padding="1rem" style:min-width="12rem">
        <strong>All members</strong>
        {#each hidden as member (member.id)}
          <Stack orientation="horizontal" gap={3} align="center">
            <UserAvatar backgroundColor="auto" name={member.name} size="sm" />
            <span>{member.name}</span>
          </Stack>
        {/each}
      </Stack>
    </Popover>
  </UserAvatarGroup>
</div>
