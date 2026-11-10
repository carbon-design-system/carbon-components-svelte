<script>
  import {
    Button,
    Modal,
    Popconfirm,
    Portal,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
  let members = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson"];
</script>

<Button on:click={() => (open = true)}>Manage members</Button>

<Portal>
  <Modal
    bind:open
    passiveModal
    modalHeading="Project members"
    on:close={() => (open = false)}
  >
    <Stack gap={3}>
      {#each members as member (member)}
        <Stack orientation="horizontal" gap={5} align="center">
          <span>{member}</span>
          <Popconfirm
            title="Remove {member}?"
            confirmText="Remove"
            direction="right"
            on:confirm={() => (members = members.filter((m) => m !== member))}
          >
            <Button kind="danger-ghost" size="small">Remove</Button>
          </Popconfirm>
        </Stack>
      {/each}
    </Stack>
  </Modal>
</Portal>
