<script>
  import {
    Button,
    Dropdown,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let dialog = null;
</script>

<Button on:click={() => dialog?.showModal()}>Open dialog</Button>

<dialog bind:this={dialog}>
  <Stack gap={5}>
    <p>
      Carbon components that portal their floating content (dropdowns, overflow
      menus, tooltips, date pickers, etc.) are automatically mounted into the
      nearest <code>&lt;dialog&gt;</code> ancestor, so they render above the
      modal backdrop in the top layer.
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
    <Button kind="secondary" on:click={() => dialog.close()}>Close</Button>
  </Stack>
</dialog>
