<script>
  import {
    announce,
    Announcer,
    Dialog,
    Modal,
    Stack,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  // `?component` puts an `<Announcer />` in the layout, as an app would.
  const withComponent = new URLSearchParams(location.search).has("component");

  // A hook for the browser tests, which send bursts of messages.
  Object.assign(window, { __announce: announce });

  let modalOpen = false;
  let dialogOpen = false;

  /** @param {MouseEvent} event */
  function sayAbout(event) {
    announce("Saved in the dialog", {
      channel: "dialog",
      source: /** @type {Element} */ (event.currentTarget),
    });
  }

  // The host page keeps one document across tests, and the announcer with it.
  onMount(() => () => {
    for (const channel of ["default", "save", "dialog", "count"]) {
      announce("", { channel });
    }
  });
</script>

{#if withComponent}
  <Announcer data-testid="announcer-component" />
{/if}

<main>
  <h1>Announcer</h1>
  <Stack gap={6}>
    <section>
      <h2>Page</h2>
      <button
        type="button"
        data-testid="say-saved"
        on:click={() => announce("Saved", { channel: "save" })}
      >
        Say saved
      </button>
    </section>

    <section>
      <h2>Modal</h2>
      <button
        type="button"
        data-testid="open-modal"
        on:click={() => (modalOpen = true)}
      >
        Open modal
      </button>
      <button
        type="button"
        data-testid="open-dialog"
        on:click={() => (dialogOpen = true)}
      >
        Open dialog
      </button>
    </section>
  </Stack>
</main>

<Modal bind:open={modalOpen} passiveModal modalHeading="A modal">
  <Stack gap={4}>
    <button type="button" data-testid="modal-say" on:click={sayAbout}>
      Say in the modal
    </button>
  </Stack>
</Modal>

<Dialog bind:open={dialogOpen} modal aria-label="A native dialog">
  <Stack gap={4}>
    <button type="button" data-testid="dialog-say" on:click={sayAbout}>
      Say in the dialog
    </button>
    <button type="button" on:click={() => (dialogOpen = false)}>Close</button>
  </Stack>
</Dialog>
