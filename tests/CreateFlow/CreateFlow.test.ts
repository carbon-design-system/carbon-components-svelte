import { render, screen, waitFor } from "@testing-library/svelte";
import { get } from "svelte/store";
import { user } from "../utils/user";
import CreateFlow from "./CreateFlow.test.svelte";

const next = () =>
  screen.getByRole("button", {
    name: /^(Next|Submit)( Checking| Submitting)?$/,
  });

async function advance() {
  await user.click(next());
  await waitFor(() => expect(document.activeElement?.tagName).toBe("H2"));
}

describe("CreateFlow", () => {
  it("renders the steps in a vertical rail, with the current one marked", () => {
    render(CreateFlow);

    const nav = screen.getByRole("navigation", { name: "Steps" });
    expect(nav.querySelector(".bx--progress--vertical")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(
      screen.getByRole("button", { name: "Networking" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Optional")).toHaveClass("bx--progress-optional");
  });

  it("builds a step on its first visit and keeps the earlier one, hidden", async () => {
    render(CreateFlow);

    expect(screen.queryByLabelText("Subnet")).toBeNull();
    await user.type(screen.getByLabelText("Name"), "web-1");
    await advance();

    expect(screen.getByLabelText("Subnet")).toBeVisible();
    expect(
      screen.getByLabelText("Name", { selector: "input" }),
    ).not.toBeVisible();
    expect(screen.getByLabelText("Name", { selector: "input" })).toHaveValue(
      "web-1",
    );
  });

  it("removes the content of the steps left when keepMounted is false", async () => {
    render(CreateFlow, { props: { keepMounted: false } });
    await advance();

    expect(screen.queryByLabelText("Name")).toBeNull();
    expect(screen.getByLabelText("Subnet")).toBeVisible();
  });

  it("moves focus to the new step's heading, named with the step count", async () => {
    render(CreateFlow);
    await advance();

    const heading = screen.getByRole("heading", {
      name: "Step 2 of 4: Networking",
    });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByRole("group", { name: "Step 2 of 4: Networking" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Step 1 of 4: Details" }),
      ).toHaveFocus(),
    );
  });

  it("goes back to a completed step from the rail, and not ahead to one that isn't", async () => {
    render(CreateFlow);
    await advance();

    await user.click(screen.getByRole("button", { name: /^Review/ }));
    expect(screen.queryByRole("heading", { name: /Review/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Details/ }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Step 1 of 4: Details" }),
      ).toHaveFocus(),
    );
  });

  it("enters any step from the rail in a non-linear flow", async () => {
    render(CreateFlow, { props: { linear: false } });

    await user.click(screen.getByRole("button", { name: /^Review/ }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Step 4 of 4: Review" }),
      ).toHaveFocus(),
    );
  });

  it("drops a skipped step from the rail and the count", async () => {
    const { component } = render(CreateFlow);
    component.skipStorage = true;

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^Storage/ })).toBeNull(),
    );
    await advance();
    expect(
      screen.getByRole("heading", { name: "Step 2 of 3: Networking" }),
    ).toBeInTheDocument();
  });

  it("shows Back after the first step, and Submit on the last", async () => {
    render(CreateFlow);

    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    await advance();
    await advance();
    await advance();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(next()).toHaveTextContent("Submit");
  });

  it("advances on Enter in a field, which is the form's submit", async () => {
    render(CreateFlow);

    await user.type(screen.getByLabelText("Name"), "web-1{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Step 2 of 4: Networking" }),
      ).toHaveFocus(),
    );
  });

  it("dispatches cancel from Cancel", async () => {
    const { component } = render(CreateFlow);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(component.cancelled).toBe(1);
  });

  describe("validation", () => {
    it("stays on the step and focuses its first invalid field", async () => {
      render(CreateFlow, {
        props: { validate: () => false, invalid: true },
      });
      await user.click(next());

      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
      expect(
        screen.getByRole("button", { name: /^Details/ }),
      ).toHaveAccessibleName(/invalid/);
      expect(screen.queryByLabelText("Subnet")).toBeNull();
    });

    it("focuses the step's heading when no field is marked invalid", async () => {
      render(CreateFlow, { props: { validate: () => false } });
      await user.click(next());

      await waitFor(() =>
        expect(screen.getByRole("heading", { name: /Details/ })).toHaveFocus(),
      );
    });

    it("shows a spinner on Next while an async check runs, then moves on", async () => {
      let finish: (value: boolean) => void = () => {};
      const validate = vi.fn(
        () => new Promise<boolean>((resolve) => (finish = resolve)),
      );
      render(CreateFlow, { props: { validate } });
      await user.click(next());

      expect(next()).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Checking")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
      finish(true);
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /Networking/ }),
        ).toHaveFocus(),
      );
      expect(next()).not.toHaveAttribute("aria-busy");
    });

    it("shows what a failed check threw in a notification, and focuses it", async () => {
      render(CreateFlow, {
        props: {
          validate: () => Promise.reject(new Error("The service is down.")),
        },
      });
      await user.click(next());

      const message = await screen.findByText("The service is down.");
      const error = message.closest("[data-create-flow-error]");
      expect(error).toHaveFocus();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Close notification" }),
      );
      expect(screen.queryByText("The service is down.")).toBeNull();
    });
  });

  describe("submit", () => {
    async function toReview(component: {
      flow: { next: () => Promise<boolean> };
    }) {
      await component.flow.next();
      await component.flow.next();
      await component.flow.next();
    }

    it("shows the submitted content, focuses it and replaces the buttons with Done", async () => {
      const { component } = render(CreateFlow, {
        props: { submit: () => Promise.resolve() },
      });
      await toReview(component);
      await user.click(next());

      await waitFor(() =>
        expect(screen.getByText("All done").parentElement).toHaveFocus(),
      );
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(component.done).toBe(1);
    });

    it("keeps the review step and shows the error when the submit fails", async () => {
      const { component } = render(CreateFlow, {
        props: { submit: () => Promise.reject(new Error("Quota used up.")) },
      });
      await toReview(component);
      await user.click(next());

      const message = await screen.findByText("Quota used up.");
      expect(message.closest("[data-create-flow-error]")).toHaveFocus();
      expect(next()).toHaveTextContent("Submit");
      expect(next()).toBeEnabled();
    });
  });

  describe("unsaved changes", () => {
    it("sees a change made in an earlier step while the user is on a later one", async () => {
      const { component } = render(CreateFlow);
      await user.type(screen.getByLabelText("Name"), "web-1");
      expect(get(component.unsaved.dirty)).toBe(true);
      await advance();

      expect(get(component.unsaved.dirty)).toBe(true);
    });

    it("loses a change made in a step that is removed, with keepMounted false", async () => {
      const { component } = render(CreateFlow, {
        props: { keepMounted: false },
      });
      await user.type(screen.getByLabelText("Name"), "web-1");
      expect(get(component.unsaved.dirty)).toBe(true);
      await advance();

      await waitFor(() => expect(get(component.unsaved.dirty)).toBe(false));
    });

    it("is clean once the submit succeeds", async () => {
      const { component } = render(CreateFlow, {
        props: { submit: () => Promise.resolve() },
      });
      await user.type(screen.getByLabelText("Name"), "web-1");
      await component.flow.next();
      await component.flow.next();
      await component.flow.next();
      expect(get(component.unsaved.dirty)).toBe(true);
      await component.flow.next();

      expect(get(component.unsaved.dirty)).toBe(false);
    });
  });
});
