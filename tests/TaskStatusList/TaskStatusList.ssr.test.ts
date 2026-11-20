// @vitest-environment node
import TaskStatusList from "carbon-components-svelte/TaskStatusList/TaskStatusList.svelte";
import { renderSSR } from "../utils/ssr";

describe("TaskStatusList (server)", () => {
  // The server has no clock to measure a running step against, so it
  // writes no time that the first client render could disagree with.
  it("renders the list, the statuses, both live regions and no running time", () => {
    const { document } = renderSSR(TaskStatusList, {
      "aria-label": "Cluster provisioning",
      steps: [
        {
          id: "1",
          label: "Create VPC",
          status: "succeeded",
          startedAt: 0,
          endedAt: 12_000,
        },
        {
          id: "2",
          label: "Configure network",
          status: "running",
          startedAt: 12_000,
        },
        { id: "3", label: "Create cluster", status: "pending" },
      ],
    });

    const list = document.querySelector("ol");
    expect(list?.getAttribute("aria-label")).toBe("Cluster provisioning");
    expect(
      [...document.querySelectorAll(".bx--task-status-list__label")].map(
        (label) => label.textContent?.trim(),
      ),
    ).toEqual([
      "Create VPC, Succeeded",
      "Configure network, Running",
      "Create cluster, Pending",
    ]);
    expect(
      [...document.querySelectorAll("time")].map((t) => t.textContent),
    ).toEqual(["12s"]);
    expect(
      document.querySelector(".bx--task-status-list__summary")?.textContent,
    ).toContain("1 of 3 complete");
    expect(document.querySelector("[role=status]")?.textContent).toBe("");
    expect(document.querySelector("[role=alert]")?.textContent).toBe("");
  });
});
