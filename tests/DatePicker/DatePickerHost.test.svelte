<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";

  export let container: "dialog" | "popover" | "modal" = "dialog";
  // Set to leave `portalMenu` unset, so the picker infers it from a Modal.
  export let inheritPortalMenu = false;
  export let portalMenu = true;
  export let modalOpen = true;
  export let open = true;
  export let closeOnOutsideClick = true;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  $: portalProps = inheritPortalMenu ? {} : { portalMenu };
</script>

{#if container === "dialog"}
  <dialog open>
    <DatePicker datePickerType="single" {...portalProps}>
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </dialog>
{:else if container === "popover"}
  <Popover bind:open {closeOnOutsideClick} on:close={onClose}>
    <DatePicker datePickerType="single" {...portalProps}>
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </Popover>
{:else}
  <Modal
    bind:open={modalOpen}
    modalHeading="Test"
    primaryButtonText="OK"
    secondaryButtonText="Cancel"
  >
    <DatePicker datePickerType="single" {...portalProps}>
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </Modal>
{/if}
