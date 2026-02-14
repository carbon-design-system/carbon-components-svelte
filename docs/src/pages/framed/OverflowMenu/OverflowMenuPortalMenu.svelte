<script>
  import {
    Button,
    Modal,
    OverflowMenu,
    OverflowMenuItem,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Modal
  bind:open
  size="sm"
  modalHeading="API keys"
  primaryButtonText="Done"
  on:click:button--primary={() => (open = false)}
>
  <StructuredList condensed flush>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Name</StructuredListCell>
        <StructuredListCell head>Created</StructuredListCell>
        <StructuredListCell head />
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      <StructuredListRow>
        <StructuredListCell noWrap>my-api-key</StructuredListCell>
        <StructuredListCell noWrap>2025-01-15</StructuredListCell>
        <StructuredListCell>
          <OverflowMenu portalMenu flipped>
            <OverflowMenuItem text="Edit" />
            <OverflowMenuItem text="Duplicate" />
            <OverflowMenuItem danger text="Delete" />
          </OverflowMenu>
        </StructuredListCell>
      </StructuredListRow>
      <StructuredListRow>
        <StructuredListCell noWrap>prod-key</StructuredListCell>
        <StructuredListCell noWrap>2025-03-22</StructuredListCell>
        <StructuredListCell>
          <OverflowMenu portalMenu flipped>
            <OverflowMenuItem text="Edit" />
            <OverflowMenuItem text="Duplicate" />
            <OverflowMenuItem danger text="Delete" />
          </OverflowMenu>
        </StructuredListCell>
      </StructuredListRow>
    </StructuredListBody>
  </StructuredList>
</Modal>
