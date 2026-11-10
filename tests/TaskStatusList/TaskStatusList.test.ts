import { act, render, screen, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import type { TaskStep } from "carbon-components-svelte/TaskStatusList/TaskStatusList.svelte";
import TaskStatusList from "./TaskStatusList.test.svelte";

type Steps = TaskStep[];

const step = (
  id: string,
  status: Steps[number]["status"],
  extra: Partial<Steps[number]> = {},
): Steps[number] => ({ id, label: `Step ${id}`, status, ...extra });

const provisioning: Steps = [
  step("1", "succeeded", { startedAt: 0, endedAt: 12_000 }),
  step("2", "succeeded", { startedAt: 12_000, endedAt: 77_000 }),
  step("3", "running", { startedAt: 77_000, detail: "2 of 3 nodes ready" }),
  step("4", "pending"),
];

// The clock is fake, so the user's delays wait on it.
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const polite = () => screen.getByRole("status");
const alert = () => screen.getByRole("alert");
const advance = async (ms: number) => {
  await act(() => vi.advanceTimersByTime(ms));
};

describe("TaskStatusList", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
      ],
    });
    vi.setSystemTime(80_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a named ordered list that says each status in text", () => {
    render(TaskStatusList, { steps: provisioning });

    const list = screen.getByRole("list", { name: "Cluster provisioning" });
    const items = within(list).getAllByRole("listitem");
    expect(
      items.map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual([
      "1. Step 1, Succeeded 12s",
      "2. Step 2, Succeeded 1m 5s",
      "3. Step 3, Running 3s 2 of 3 nodes ready",
      "4. Step 4, Pending",
    ]);
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[3]).not.toHaveAttribute("aria-current");
    expect(screen.getByText("2 of 4 complete")).toBeInTheDocument();
  });

  it("counts a running step up each second, and only then", async () => {
    render(TaskStatusList, { steps: provisioning });
    expect(screen.getByText("3s")).toBeInTheDocument();

    await advance(2000);
    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("stops its timer when no step runs", async () => {
    const { rerender } = render(TaskStatusList, { steps: provisioning });
    await rerender({
      steps: [
        ...provisioning.slice(0, 2),
        step("3", "succeeded", { startedAt: 77_000, endedAt: 80_000 }),
        step("4", "succeeded", { startedAt: 80_000, endedAt: 81_000 }),
      ],
    });

    expect(vi.getTimerCount()).toBe(0);
    expect(polite()).toHaveTextContent("All 4 steps complete");
  });

  it("opens a failed step's error under a button that names its state", async () => {
    render(TaskStatusList, {
      steps: [
        step("1", "succeeded"),
        step("2", "failed", { error: "QuotaExceeded: 3 of 3 vCPUs used" }),
      ],
    });
    const toggle = screen.getByRole("button", { name: /Show details/ });
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") as string,
    ) as HTMLElement;

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
    expect(toggle).toHaveAccessibleDescription("2. Step 2, Failed");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent("Hide details");
    expect(panel).toBeVisible();
    expect(panel).toHaveTextContent("QuotaExceeded: 3 of 3 vCPUs used");
    expect(screen.getByTestId("expanded")).toHaveTextContent("2");
  });

  it("offers Retry from the failed step, Retry all and Cancel as events", async () => {
    const failed = [
      step("1", "succeeded"),
      step("2", "succeeded"),
      step("3", "failed"),
      step("4", "pending"),
    ];
    const { rerender } = render(TaskStatusList, {
      steps: failed,
      retryable: true,
      cancelable: true,
    });

    expect(screen.getByText("Failed at step 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Retry from step 3" }));
    await user.click(screen.getByRole("button", { name: "Retry all" }));

    await rerender({ steps: [...failed.slice(0, 2), step("3", "running")] });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      JSON.parse(screen.getByTestId("events").textContent as string),
    ).toEqual([
      { type: "retry", from: "failed", index: 2 },
      { type: "retry", from: "start", index: 2 },
      { type: "cancel" },
    ]);
  });

  it("moves focus to Retry when pressing Cancel removes the focused button", async () => {
    const running = [step("1", "succeeded"), step("2", "running")];
    const { rerender } = render(TaskStatusList, {
      steps: running,
      retryable: true,
      cancelable: true,
    });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    cancel.focus();

    await rerender({
      steps: [running[0], step("2", "canceled")],
    });

    expect(
      screen.getByRole("button", { name: "Retry from step 2" }),
    ).toHaveFocus();
  });

  it("renders the step slot", () => {
    render(TaskStatusList, { steps: [step("1", "pending")] });
    expect(screen.getByRole("listitem")).toHaveTextContent("1. Step 1");
  });

  describe("announcements", () => {
    it("says nothing for the state it mounts in", async () => {
      render(TaskStatusList, { steps: provisioning });
      await advance(5000);

      expect(polite().textContent).toBe("");
      expect(alert().textContent).toBe("");
    });

    it("says a failure at once, in the alert region", async () => {
      const { rerender } = render(TaskStatusList, { steps: provisioning });

      await rerender({
        steps: [
          ...provisioning.slice(0, 2),
          step("3", "failed", { startedAt: 77_000, endedAt: 79_000 }),
          provisioning[3],
        ],
      });

      expect(alert()).toHaveTextContent("Failed at step 3: Step 3");
      expect(polite().textContent).toBe("");
    });

    it("says 50 steps finishing in a burst once, then the last", async () => {
      const all = (done: number): Steps =>
        Array.from({ length: 50 }, (_, index) =>
          step(
            String(index),
            index < done ? "succeeded" : index === done ? "running" : "pending",
          ),
        );
      const { rerender } = render(TaskStatusList, { steps: all(0) });
      const said: string[] = [];
      const watch = new MutationObserver(() =>
        said.push(polite().textContent as string),
      );
      watch.observe(polite(), {
        childList: true,
        characterData: true,
        subtree: true,
      });

      for (let done = 1; done <= 49; done++) {
        // eslint-disable-next-line no-await-in-loop -- one update every 20 ms
        await rerender({ steps: all(done) });
        // eslint-disable-next-line no-await-in-loop -- one update every 20 ms
        await advance(20);
      }
      await advance(1500);
      watch.disconnect();

      expect(said.length).toBeLessThanOrEqual(3);
      expect(said.at(-1)).toBe("49 of 50 complete: Step 49");
    });

    it("says nothing when announce is off", async () => {
      const { rerender } = render(TaskStatusList, {
        steps: provisioning,
        announce: false,
      });

      await rerender({
        steps: [
          ...provisioning.slice(0, 2),
          step("3", "failed"),
          provisioning[3],
        ],
      });

      expect(alert().textContent).toBe("");
    });
  });
});
