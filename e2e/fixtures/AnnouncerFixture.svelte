<script>
  import {
    announce,
    Announcer,
    announceSourceStatus,
    clearAnnouncements,
    ComboBox,
    Dialog,
    Modal,
    pushAnnouncerHost,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import { createMiniSource } from "./mini-async-source.js";

  // `?component` puts an `<Announcer />` in the layout, as an app would.
  const withComponent = new URLSearchParams(location.search).has("component");

  // A hook for the browser tests, which run bursts and read the tree.
  Object.assign(window, {
    __announcer: { announce, clearAnnouncements, pushAnnouncerHost },
  });

  let modalOpen = false;
  let dialogOpen = false;
  let query = "";

  const people = Array.from({ length: 200 }, (_, i) => `Person ${i}`);
  const comboItems = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  // C1's source, copied small. Answers take longer for longer queries.
  const source = createMiniSource(
    (text, { signal }) =>
      new Promise((resolve, reject) => {
        const done = setTimeout(
          () => resolve(people.filter((name) => name.includes(text))),
          text.length * 150,
        );
        signal.addEventListener("abort", () => {
          clearTimeout(done);
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
    { debounce: 100 },
  );
  $: results = $source.data;

  onMount(() =>
    announceSourceStatus(source.onStatus, {
      channel: "people",
      loading: () => "Loading people",
      results: (count) => (count === 0 ? "No people" : `${count} people`),
      error: () => "Could not load people",
    }),
  );

  /** @param {MouseEvent} event */
  function sayAbout(event) {
    announce("Saved in the dialog", {
      source: /** @type {Element} */ (event.currentTarget),
    });
  }
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
      <button
        type="button"
        data-testid="say-failed"
        on:click={() => announce("Could not save", { politeness: "assertive" })}
      >
        Say failed
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

    <section>
      <h2>Async source</h2>
      <TextInput
        labelText="Search people"
        bind:value={query}
        on:input={() => source.set(query)}
      />
      <p data-testid="result-count" aria-hidden="true">{results.length}</p>
    </section>
  </Stack>
</main>

<Modal
  bind:open={modalOpen}
  passiveModal
  modalHeading="A modal"
  aria-label="A modal"
>
  <Stack gap={4}>
    <button type="button" data-testid="modal-say" on:click={sayAbout}>
      Say in the modal
    </button>
    <ComboBox
      labelText="Contact"
      placeholder="Type to filter"
      items={comboItems}
      shouldFilterItem={(item, value) =>
        item.text.toLowerCase().includes(value.toLowerCase())}
    />
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
