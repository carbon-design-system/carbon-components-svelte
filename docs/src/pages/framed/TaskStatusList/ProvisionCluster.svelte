<script>
  import {
    Button,
    createTaskRunner,
    Stack,
    TaskStatusList,
  } from "carbon-components-svelte";

  // For demo purposes only: simulate each task with a timer that stops
  // when the signal aborts.
  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  // The network step times out the first time and works on the retry.
  let networkAttempts = 0;

  const runner = createTaskRunner([
    { id: "vpc", label: "Create VPC", run: ({ signal }) => wait(900, signal) },
    {
      id: "subnets",
      label: "Create subnets",
      run: ({ signal }) => wait(1200, signal),
    },
    {
      id: "network",
      label: "Configure network",
      run: async ({ signal }) => {
        await wait(1000, signal);
        networkAttempts += 1;
        if (networkAttempts === 1) {
          throw new Error(
            "NetworkTimeout: gateway 10.240.0.1 did not answer within 30s\n" +
              "  region: us-south-2\n" +
              "  request: PUT /v1/gateways/gw-4f2a",
          );
        }
      },
    },
    {
      id: "cluster",
      label: "Create cluster",
      detail: "Waiting for nodes",
      run: async ({ signal, setDetail }) => {
        await wait(900, signal);
        setDetail("1 of 3 nodes ready");
        await wait(900, signal);
        setDetail("2 of 3 nodes ready");
        await wait(900, signal);
        setDetail("3 of 3 nodes ready");
      },
    },
    {
      id: "ingress",
      label: "Install ingress",
      run: ({ signal }) => wait(800, signal),
    },
  ]);

  function startOver() {
    networkAttempts = 0;
    runner.run();
  }
</script>

<Stack gap={5}>
  <TaskStatusList
    aria-label="Cluster provisioning"
    steps={$runner.steps}
    cancelable
    retryable
    on:cancel={() => runner.cancel()}
    on:retry={(event) => runner.retry({ from: event.detail.from })}
  />
  <div>
    <Button
      kind="tertiary"
      size="small"
      disabled={$runner.status === "running"}
      on:click={startOver}
    >
      {$runner.status === "pending" ? "Create cluster" : "Start over"}
    </Button>
  </div>
</Stack>
