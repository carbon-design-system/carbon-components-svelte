<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ButtonSkeleton from "carbon-components-svelte/Button/ButtonSkeleton.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";

  export let size: "xs" | "sm" | "xl" | undefined = undefined;
</script>

<Form {size}>
  <Button data-testid="inherits">Save</Button>
  <Button data-testid="own-size" size="field">Cancel</Button>
  <ButtonSkeleton data-testid="skeleton" />
  <Button data-testid="skeleton-prop" skeleton />
  <Pagination totalItems={40} />
  <Modal
    open
    modalHeading="Delete"
    primaryButtonText="Delete"
    secondaryButtonText="Cancel"
  />
</Form>
