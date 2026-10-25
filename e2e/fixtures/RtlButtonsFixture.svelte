<script>
  import {
    ActionSet,
    Button,
    ButtonSet,
    ChatButton,
    ComboButton,
    MenuButton,
    MenuItem,
    Modal,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const kinds = [
    "primary",
    "secondary",
    "tertiary",
    "ghost",
    "danger",
    "danger-tertiary",
    "danger-ghost",
  ];
  const sizes = ["xs", "small", "field", "default", "lg", "xl"];
</script>

<!-- Every case is measured from its own edges, so each sits on its own row. -->
<div class="cases">
  {#each kinds as kind (kind)}
    <div>
      <Button data-testid="kind-{kind}" {kind} icon={Add}>Deploy</Button>
    </div>
    <div>
      <Button
        data-testid="icon-only-{kind}"
        {kind}
        icon={Add}
        iconDescription="Add"
      />
    </div>
  {/each}
  {#each sizes as size (size)}
    <div>
      <Button data-testid="size-{size}" {size} icon={Add}>Deploy</Button>
    </div>
    <div>
      <Button data-testid="ghost-{size}" kind="ghost" {size} icon={Add}>
        Deploy
      </Button>
    </div>
  {/each}
  <div>
    <Button data-testid="no-icon">Deploy</Button>
  </div>
  <div>
    <Button data-testid="expressive" expressive icon={Add}>Deploy</Button>
  </div>
  <div>
    <Button data-testid="loading" loading>Deploy</Button>
  </div>
  <div>
    <Button data-testid="loading-ghost" kind="ghost" loading>Deploy</Button>
  </div>
  <div>
    <ChatButton data-testid="chat">Summarize</ChatButton>
  </div>
  <div data-testid="button-set" class="set">
    <ButtonSet>
      <Button kind="secondary">Cancel</Button>
      <Button icon={Add}>Deploy</Button>
    </ButtonSet>
  </div>
  <div data-testid="button-set-disabled" class="set">
    <ButtonSet>
      <Button kind="secondary">Cancel</Button>
      <Button disabled>Deploy</Button>
    </ButtonSet>
  </div>
  <div data-testid="action-set" class="set">
    <ActionSet size="lg">
      <Button kind="ghost">Discard</Button>
      <Button kind="secondary">Save draft</Button>
      <Button>Deploy</Button>
    </ActionSet>
  </div>
  <div data-testid="combo-button">
    <ComboButton labelText="Deploy">
      <MenuItem>Deploy to staging</MenuItem>
    </ComboButton>
  </div>
  <div data-testid="menu-button">
    <MenuButton labelText="Actions">
      <MenuItem>Restart</MenuItem>
    </MenuButton>
  </div>
</div>

<!-- Closed modals keep their layout, so their footers can be measured. -->
<div data-testid="modal">
  <Modal
    modalHeading="Deploy service"
    primaryButtonText="Deploy"
    secondaryButtonText="Cancel"
  />
</div>
<div data-testid="modal-three">
  <Modal
    modalHeading="Deploy service"
    primaryButtonText="Deploy"
    secondaryButtons={[{ text: "Cancel" }, { text: "Save draft" }]}
  />
</div>

<style>
  .cases > div {
    width: max-content;
    margin-bottom: 1rem;
  }

  .cases > .set {
    width: 40rem;
  }
</style>
