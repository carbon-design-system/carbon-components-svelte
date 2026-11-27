<script lang="ts">
  import {
    Button,
    createTaskRunner,
    Stack,
    TaskStatusList,
  } from "carbon-components-svelte";

  const base = 1_700_000_000_000;

  const statuses = [
    {
      id: "vpc",
      label: "Create VPC",
      status: "succeeded",
      startedAt: base,
      endedAt: base + 12_000,
    },
    {
      id: "subnets",
      label: "Create subnets",
      status: "running",
      startedAt: Date.now() - 5000,
      detail: "2 of 3 subnets ready",
    },
    { id: "ingress", label: "Install ingress", status: "pending" },
    {
      id: "network",
      label: "Configure network",
      status: "failed",
      startedAt: base + 12_000,
      endedAt: base + 43_000,
      detail: "The gateway did not answer in time.",
      href: "#log",
      error:
        "NetworkTimeout: gateway 10.240.0.1 did not answer within 30s\n  region: us-south-2",
    },
    { id: "seed", label: "Seed sample data", status: "skipped" },
    { id: "invite", label: "Send invitations", status: "canceled" },
  ] as const;

  let expandedIds = ["network"];

  function wait(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  // Step 37 of 50 fails once, so one run covers a failure and a retry.
  let attempts = 0;
  const many = createTaskRunner(
    Array.from({ length: 50 }, (_, index) => ({
      id: `step-${index + 1}`,
      label: `Step ${index + 1}`,
      run: async ({ signal }) => {
        await wait(30, signal);
        if (index === 36 && attempts++ === 0) {
          throw new Error("Step 37 failed: quota exceeded");
        }
      },
    })),
  );

  const slow = createTaskRunner(
    ["Validate", "Import", "Assign groups", "Send invitations"].map(
      (label) => ({
        id: label,
        label,
        run: ({ signal }) => wait(600, signal),
      }),
    ),
  );
</script>

<Stack gap={6}>
  <div data-testid="statuses">
    <TaskStatusList aria-label="Statuses" steps={statuses} bind:expandedIds />
  </div>

  <div data-testid="compact">
    <TaskStatusList aria-label="Compact" size="sm" steps={statuses} />
  </div>

  <div data-testid="many">
    <Stack gap={4}>
      <Button data-testid="run-many" on:click={() => many.run()}>Run 50</Button>
      <TaskStatusList
        aria-label="Fifty steps"
        steps={$many.steps}
        cancelable
        retryable
        on:cancel={() => many.cancel()}
        on:retry={(event) => many.retry({ from: event.detail.from })}
      />
    </Stack>
  </div>

  <div data-testid="slow">
    <Stack gap={4}>
      <Button data-testid="run-slow" on:click={() => slow.run()}>
        Run slow
      </Button>
      <TaskStatusList
        aria-label="Slow import"
        steps={$slow.steps}
        cancelable
        retryable
        on:cancel={() => slow.cancel()}
        on:retry={(event) => slow.retry({ from: event.detail.from })}
      />
    </Stack>
  </div>
</Stack>
