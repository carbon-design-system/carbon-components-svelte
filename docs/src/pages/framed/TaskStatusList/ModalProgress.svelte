<script>
  import {
    Button,
    ComposedModal,
    createTaskRunner,
    ModalBody,
    ModalFooter,
    ModalHeader,
    TaskStatusList,
  } from "carbon-components-svelte";

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  // For demo purposes only: the third step fails the first time.
  let attempts = 0;

  const runner = createTaskRunner([
    {
      id: "validate",
      label: "Validate users.csv",
      run: ({ signal }) => wait(800, signal),
    },
    {
      id: "import",
      label: "Import 1,240 users",
      run: ({ signal }) => wait(1400, signal),
    },
    {
      id: "groups",
      label: "Assign groups",
      run: async ({ signal }) => {
        await wait(900, signal);
        attempts += 1;
        if (attempts === 1) throw new Error("Group “Finance” was not found");
      },
    },
    {
      id: "invite",
      label: "Send invitations",
      run: ({ signal }) => wait(1000, signal),
    },
  ]);

  let open = false;

  $: status = $runner.status;

  function start() {
    open = true;
    runner.run();
  }

  function handleSecondary(event) {
    if (status !== "running") return;
    // Cancel stops the import and leaves the modal open to retry.
    event.preventDefault();
    runner.cancel();
  }
</script>

<Button on:click={start}>Import users</Button>

<ComposedModal
  bind:open
  size="sm"
  preventCloseOnClickOutside={status === "running"}
  on:close={() => runner.cancel()}
  on:submit={() => runner.retry()}
>
  <ModalHeader title="Importing users" />
  <ModalBody>
    <TaskStatusList
      aria-label="Import progress"
      size="sm"
      steps={$runner.steps}
    />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Retry"
    primaryButtonDisabled={status !== "failed" && status !== "canceled"}
    secondaryButtonText={status === "running" ? "Cancel import" : "Close"}
    on:click:button--secondary={handleSecondary}
  />
</ComposedModal>
