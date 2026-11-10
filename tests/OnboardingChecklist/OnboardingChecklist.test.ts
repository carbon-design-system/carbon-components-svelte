import { render, screen, within } from "@testing-library/svelte";
import { get } from "svelte/store";
import {
  type ChecklistTask,
  createChecklistStore,
  localChecklistStorage,
} from "../../src/utils/checklist-store";
import { user } from "../utils/user";
import OnboardingChecklist from "./OnboardingChecklist.test.svelte";

const KEY = "carbon:onboarding:setup";

function tasks(connected = false): ChecklistTask[] {
  return [
    {
      id: "connect",
      title: "Connect a data source",
      description: "Detected once your first source syncs.",
      section: "Connect",
      cta: { text: "Connect source" },
      completed: connected,
    },
    {
      id: "invite",
      title: "Invite a teammate",
      section: "Connect",
      cta: { text: "Invite", href: "#invite" },
      optional: true,
    },
    { id: "alert", title: "Create an alert", section: "Configure" },
    { id: "publish", title: "Publish a report", section: "Configure" },
  ];
}

function stored() {
  return JSON.parse(localStorage.getItem(KEY) as string);
}

function progressText() {
  return screen.getByRole("progressbar").getAttribute("aria-valuetext");
}

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is a region named by its heading, with the tasks as a list per section", () => {
    render(OnboardingChecklist, { tasks: tasks() });

    const region = screen.getByRole("region", { name: "Getting started" });
    expect(
      within(region).getByRole("heading", {
        level: 2,
        name: "Getting started",
      }),
    ).toBeVisible();
    const groups = within(region).getAllByRole("group");
    expect(
      groups.map((group) => group.getAttribute("aria-labelledby")),
    ).toHaveLength(2);
    expect(
      within(groups[0]).getByRole("heading", { level: 3 }),
    ).toHaveTextContent("Connect");
    expect(within(groups[0]).getAllByRole("listitem")).toHaveLength(2);
    expect(within(groups[1]).getAllByRole("listitem")).toHaveLength(2);
  });

  it("offers a checkbox for a task the user owns and status text for one the app owns", () => {
    render(OnboardingChecklist, { tasks: tasks() });

    expect(
      screen.getAllByRole("checkbox").map((box) => box.getAttribute("id")),
    ).toEqual([
      "setup-task-invite-check",
      "setup-task-alert-check",
      "setup-task-publish-check",
    ]);
    expect(
      screen.getByRole("checkbox", { name: "Create an alert" }),
    ).not.toBeChecked();
    const app = screen.getByText("Connect a data source").closest("li");
    expect(app).toHaveTextContent("Not completed");
    expect(within(app as HTMLElement).queryByRole("checkbox")).toBeNull();
  });

  it("describes each task by its description and each action by its title", () => {
    render(OnboardingChecklist, { tasks: tasks() });

    expect(
      screen.getByRole("button", { name: "Connect source" }),
    ).toHaveAccessibleDescription("Connect a data source");
    expect(screen.getByRole("link", { name: "Invite" })).toHaveAttribute(
      "href",
      "#invite",
    );
    expect(
      screen.getByRole("link", { name: "Invite" }),
    ).toHaveAccessibleDescription("Invite a teammate");
  });

  it("reports progress through the progress bar", () => {
    render(OnboardingChecklist, { tasks: tasks(true) });

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(progressText()).toBe("1 of 4 complete");
  });

  it("remembers a checked task and tells the app", async () => {
    const { unmount } = render(OnboardingChecklist, { tasks: tasks() });

    await user.click(screen.getByRole("checkbox", { name: "Create an alert" }));

    expect(progressText()).toBe("1 of 4 complete");
    expect(stored().done).toEqual(["alert"]);
    expect(screen.getByTestId("checklist")).toBeVisible();

    unmount();
    render(OnboardingChecklist, { tasks: tasks() });
    expect(
      screen.getByRole("checkbox", { name: "Create an alert" }),
    ).toBeChecked();
    expect(progressText()).toBe("1 of 4 complete");
  });

  it("fires check, action, skip and unskip", async () => {
    render(OnboardingChecklist, { tasks: tasks() });

    await user.click(screen.getByRole("checkbox", { name: "Create an alert" }));
    await user.click(screen.getByRole("button", { name: "Connect source" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Undo skip" }));

    expect(screen.getByTestId("events")).toHaveTextContent(
      "check,action,skip,unskip",
    );
  });

  it("takes a skipped task out of the count and hands focus to its undo button", async () => {
    render(OnboardingChecklist, { tasks: tasks() });
    expect(progressText()).toBe("0 of 4 complete");

    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(progressText()).toBe("0 of 3 complete");
    expect(stored().skipped).toEqual(["invite"]);
    const undo = screen.getByRole("button", { name: "Undo skip" });
    expect(undo).toHaveFocus();
    expect(screen.getByText("Skipped")).toBeVisible();

    await user.click(undo);

    expect(progressText()).toBe("0 of 4 complete");
    expect(screen.getByRole("button", { name: "Skip" })).toHaveFocus();
  });

  it("announces a task the app completes, politely, and not on first render", async () => {
    const { rerender } = render(OnboardingChecklist, { tasks: tasks() });
    const live = screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("");

    await rerender({ tasks: tasks(true) });

    expect(live).toHaveTextContent("Completed: Connect a data source");
    expect(
      screen.getByText("Connect a data source").closest("li"),
    ).toHaveTextContent("Completed");
    expect(progressText()).toBe("1 of 4 complete");
  });

  describe("when every task is done", () => {
    const done = [
      { id: "a", title: "Connect", completed: false },
      { id: "b", title: "Invite" },
    ];

    it("collapses, says so once, and stays quiet and collapsed on the next visit", async () => {
      const { rerender, unmount } = render(OnboardingChecklist, {
        tasks: done,
      });
      const toggle = screen.getByRole("button", { name: "Getting started" });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      await user.click(screen.getByRole("checkbox", { name: "Invite" }));
      expect(screen.queryByText("All set")).toBeNull();

      await rerender({ tasks: [{ ...done[0], completed: true }, done[1]] });

      expect(screen.getByText("All set")).toBeVisible();
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
      expect(screen.getByRole("status")).toHaveTextContent(
        "All set. Getting started is complete.",
      );
      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(stored().celebrated).toBe(true);
      expect(screen.getAllByRole("status")).toHaveLength(1);

      unmount();
      render(OnboardingChecklist, {
        tasks: [{ ...done[0], completed: true }, done[1]],
      });
      expect(
        screen.getByRole("button", { name: "Getting started" }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("opens again when a task is undone", async () => {
      render(OnboardingChecklist, { tasks: [{ id: "b", title: "Invite" }] });
      await user.click(screen.getByRole("checkbox", { name: "Invite" }));
      expect(screen.getByTestId("collapsed")).toHaveTextContent("true");

      await user.click(screen.getByRole("checkbox", { name: "Invite" }));

      expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
      expect(screen.queryByText("All set")).toBeNull();
    });
  });

  it("collapses to its header with the toggle", async () => {
    render(OnboardingChecklist, { tasks: tasks() });
    const toggle = screen.getByRole("button", { name: "Getting started" });
    expect(toggle).toHaveAttribute("aria-controls", "setup-body");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
    expect(toggle).toHaveFocus();
  });

  it("is gone once dismissed, for good, until the store restores it", async () => {
    const store = createChecklistStore({
      storage: localChecklistStorage(KEY),
    });
    render(OnboardingChecklist, { tasks: tasks(), store });

    await user.click(
      screen.getByRole("button", { name: "Dismiss Getting started" }),
    );

    expect(screen.queryByTestId("checklist")).toBeNull();
    expect(stored().dismissed).toBe(true);

    store.restore();
    await Promise.resolve();
    expect(await screen.findByTestId("checklist")).toBeVisible();
  });

  it("keeps floating checklists a launcher away", async () => {
    render(OnboardingChecklist, { tasks: tasks(true), floating: true });
    expect(
      screen.queryByRole("button", { name: /^Getting started,/ }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Minimize Getting started" }),
    );

    const launcher = screen.getByRole("button", {
      name: "Getting started, 1 of 4 complete",
    });
    expect(launcher).toHaveFocus();
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveAttribute("aria-controls", "setup");
    expect(screen.getByTestId("checklist")).not.toBeVisible();
    expect(stored().minimized).toBe(true);

    await user.click(launcher);

    expect(screen.getByTestId("checklist")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /^Getting started,/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Getting started" }),
    ).toHaveFocus();
    expect(stored().minimized).toBe(false);
  });

  it("starts minimized for a returning user, and says when it is all set", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ minimized: true, done: ["b"], celebrated: true }),
    );
    render(OnboardingChecklist, {
      tasks: [
        { id: "a", title: "Connect", completed: true },
        { id: "b", title: "Invite" },
      ],
      floating: true,
    });

    expect(
      screen.getByRole("button", { name: "Getting started, All set" }),
    ).toBeVisible();
  });

  it("does not minimize an inline checklist", () => {
    localStorage.setItem(KEY, JSON.stringify({ minimized: true }));
    render(OnboardingChecklist, { tasks: tasks() });

    expect(screen.getByTestId("checklist")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /^Getting started,/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Minimize Getting started" }),
    ).toBeNull();
  });

  it("renders twenty tasks in sections with every checkbox named", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `t${index}`,
      title: `Task ${index + 1}`,
      section: `Section ${Math.floor(index / 5) + 1}`,
    }));
    render(OnboardingChecklist, { tasks: many });

    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getAllByRole("group")).toHaveLength(4);
    expect(screen.getByRole("checkbox", { name: "Task 20" })).toBeVisible();
    expect(progressText()).toBe("0 of 20 complete");
  });

  it("sets the heading levels from headingLevel", () => {
    render(OnboardingChecklist, { tasks: tasks(), headingLevel: 3 });

    expect(
      screen.getByRole("heading", { level: 3, name: "Getting started" }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
  });

  it("shares one store between checklists", () => {
    const store = createChecklistStore({ storage: localChecklistStorage(KEY) });
    store.check("alert");
    render(OnboardingChecklist, { tasks: tasks(), store });

    expect(get(store).ready).toBe(true);
    expect(
      screen.getByRole("checkbox", { name: "Create an alert" }),
    ).toBeChecked();
  });
});
