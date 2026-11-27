<script>
  import {
    Modal,
    Stack,
    UserAvatar,
    UserAvatarGroup,
  } from "carbon-components-svelte";

  const members = [
    "Monica",
    "Richard Hendricks",
    "Dinesh Chugtai",
    "Bertram Gilfoyle",
    "Jared Dunn",
    "Erlich Bachman",
  ];

  let open = false;
  /** @type {{ id: string; name: string }[]} */
  let hidden = [];
</script>

<UserAvatarGroup
  max={3}
  interactiveOverflow
  on:click:overflow={({ detail }) => {
    hidden = detail.hidden;
    open = true;
  }}
>
  {#each members as name (name)}
    <UserAvatar backgroundColor="auto" {name} tooltipText={name} />
  {/each}
</UserAvatarGroup>

<Modal passiveModal bind:open modalHeading="More members">
  <Stack gap={3}>
    {#each hidden as member (member.id)}
      <Stack orientation="horizontal" gap={3} align="center">
        <UserAvatar backgroundColor="auto" name={member.name} size="sm" />
        <span>{member.name}</span>
      </Stack>
    {/each}
  </Stack>
</Modal>
