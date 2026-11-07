<script>
  import {
    Button,
    createTaskRunner,
    Stack,
    TaskStatusList,
  } from "carbon-components-svelte";

  const volumes = [
    "vol-0a1f",
    "vol-1b72",
    "vol-2d04",
    "vol-3c9a",
    "vol-48e1",
    "vol-5f30",
    "vol-6a8b",
    "vol-7e12",
    "vol-8c55",
    "vol-9d07",
    "vol-a3f4",
    "vol-b61c",
  ];

  // For demo purposes only: two volumes are still attached, so deleting
  // them fails until they are detached.
  const attached = new Set(["vol-3c9a", "vol-7e12"]);

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  // Three deletes at a time, and a failure does not stop the rest.
  const runner = createTaskRunner(
    volumes.map((name) => ({
      id: name,
      label: `Delete ${name}`,
      run: async ({ signal }) => {
        await wait(500 + (name.charCodeAt(5) % 5) * 150, signal);
        if (attached.has(name)) {
          throw new Error(
            `${name} is attached to instance i-0b3f. Detach it, then delete it.`,
          );
        }
      },
    })),
    { concurrency: 3, onError: "continue" },
  );

  function retry(from) {
    // The volumes were detached before the retry.
    attached.clear();
    runner.retry({ from });
  }
</script>

<Stack gap={5}>
  <TaskStatusList
    aria-label="Volume deletion"
    size="sm"
    steps={$runner.steps}
    cancelable
    retryable
    on:cancel={() => runner.cancel()}
    on:retry={(event) => retry(event.detail.from)}
  />
  <div>
    <Button
      kind="tertiary"
      size="small"
      disabled={$runner.status === "running"}
      on:click={() => runner.run()}
    >
      Delete 12 volumes
    </Button>
  </div>
</Stack>
