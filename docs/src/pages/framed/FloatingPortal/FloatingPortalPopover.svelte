<script>
  import {
    Button,
    Dropdown,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let popover = null;
</script>

<Button type="button" on:click={() => popover?.showPopover()}
  >Open popover</Button
>

<div
  bind:this={popover}
  popover="manual"
  style="width: min(100%, 28rem); padding: 1rem; border: 1px dashed var(--cds-border-subtle);"
>
  <Stack gap={5}>
    <p>
      With the same default <code>target</code> resolution as inside a
      <code>&lt;dialog&gt;</code>, portalled menus mount into this
      <code>[popover]</code>
      element so they stay in the popover top layer.
    </p>
    <Dropdown
      portalMenu
      titleText="Region"
      selectedId="us-south"
      items={[
        { id: "us-south", text: "Dallas (us-south)" },
        { id: "us-east", text: "Washington DC (us-east)" },
        { id: "eu-de", text: "Frankfurt (eu-de)" },
        { id: "jp-tok", text: "Tokyo (jp-tok)" },
        { id: "br-sao", text: "São Paulo (br-sao)" },
        { id: "au-syd", text: "Sydney (au-syd)" },
        { id: "ca-tor", text: "Toronto (ca-tor)" },
        { id: "de-fra", text: "Frankfurt (de-fra)" },
        { id: "es-mad", text: "Madrid (es-mad)" },
        { id: "fr-par", text: "Paris (fr-par)" },
        { id: "in-mum", text: "Mumbai (in-mum)" },
        { id: "it-mil", text: "Milan (it-mil)" },
        { id: "jp-osa", text: "Osaka (jp-osa)" },
      ]}
    />
    <OverflowMenu portalMenu>
      <OverflowMenuItem text="Edit" />
      <OverflowMenuItem text="Duplicate" />
      <OverflowMenuItem danger text="Delete" />
    </OverflowMenu>
    <Button
      kind="secondary"
      type="button"
      on:click={() => popover?.hidePopover()}
    >
      Close
    </Button>
  </Stack>
</div>
