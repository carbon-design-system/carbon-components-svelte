<script>
  import {
    Button,
    Link,
    Modal,
    Portal,
    Stack,
    Toggletip,
    ToggletipFooter,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    passiveModal
    modalHeading="Toggletip in modal"
    on:close={() => (open = false)}
  >
    <Stack orientation="horizontal" align="center" gap={3}>
      Resource list
      <Toggletip>
        Resources are provisioned based on your account's organization.
        <ToggletipFooter>
          <Link href="#">Learn more</Link>
          <Button size="small">Manage</Button>
        </ToggletipFooter>
      </Toggletip>
    </Stack>
  </Modal>
</Portal>
