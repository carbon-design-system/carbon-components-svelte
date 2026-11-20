import { render, screen, waitFor, within } from "@testing-library/svelte";
import { get } from "svelte/store";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import SettingsPage from "./SettingsPage.test.svelte";

function bar() {
  const node = screen.getByRole("region", {
    name: "Unsaved changes",
    hidden: true,
  });
  return node;
}

async function typeName(value: string) {
  const input = screen.getByRole("textbox", { name: "Display name" });
  await user.clear(input);
  await user.type(input, value);
  return input;
}

describe("SettingsPage", () => {
  it("nests section headings under the page without a wrapping Section", () => {
    render(SettingsPage);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent?.trim())).toEqual([
      "Profile",
      "Alerts",
    ]);
  });

  it("names each control once and describes it by its row", () => {
    render(SettingsPage);
    const input = screen.getByRole("textbox", { name: "Display name" });
    const description = document.getElementById(
      input.getAttribute("aria-describedby") ?? "",
    );
    expect(description).toHaveTextContent("Shown to your team.");
  });

  describe("save bar", () => {
    it("holds its place inert while the page is clean", () => {
      render(SettingsPage);
      expect(bar()).toHaveAttribute("inert");
      expect(bar()).not.toHaveClass("bx--settings-save-bar--visible");
    });

    it("shows once a field changes and counts the changes", async () => {
      render(SettingsPage);
      await typeName("Q");
      expect(bar()).not.toHaveAttribute("inert");
      expect(bar()).toHaveTextContent("You have 1 unsaved change");
    });

    it("marks the modified row", async () => {
      render(SettingsPage);
      await typeName("Q");
      const row = document.querySelector('[data-settings-row="name"]');
      expect(row).toHaveClass("bx--settings-row--modified");
      expect(screen.getByText(/Modified/)).toBeInTheDocument();
    });

    it("saves with the values and clears", async () => {
      const save = vi.fn();
      const onsave = vi.fn();
      render(SettingsPage, { save, onsave });
      await typeName("Q");

      await user.click(screen.getByRole("button", { name: /Save/ }));

      expect(save).toHaveBeenCalledWith({
        name: "Q",
        email: true,
        plan: "pro",
      });
      await waitFor(() => expect(bar()).toHaveAttribute("inert"));
      expect(onsave).toHaveBeenCalledWith({ ok: true });
    });

    it("saves with the keyboard shortcut", async () => {
      const save = vi.fn();
      render(SettingsPage, { save });
      await typeName("Q");
      await user.keyboard("{Control>}s{/Control}");
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    });

    it("discards and puts focus back on the field", async () => {
      render(SettingsPage);
      const input = await typeName("Q");

      await user.click(screen.getByRole("button", { name: "Discard" }));

      expect(input).toHaveValue("Priya");
      await waitFor(() => expect(input).toHaveFocus());
      expect(bar()).toHaveAttribute("inert");
    });
  });

  describe("server errors", () => {
    const save = () => ({ errors: { name: "That name is taken." } });

    it("shows the message on the field, in the nav and on the section", async () => {
      render(SettingsPage, { save });
      const input = await typeName("taken");

      await user.click(screen.getByRole("button", { name: /Save/ }));

      await waitFor(() =>
        expect(screen.getByText("That name is taken.")).toBeInTheDocument(),
      );
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveFocus();
      expect(screen.getByRole("link", { name: /Profile/ })).toHaveTextContent(
        "1 error",
      );
      expect(screen.getByRole("group", { name: /Profile/ })).toHaveTextContent(
        "1 error",
      );
      expect(bar()).toHaveTextContent("1 setting could not be saved");
    });

    it("withdraws the message once the field changes", async () => {
      render(SettingsPage, { save });
      await typeName("taken");
      await user.click(screen.getByRole("button", { name: /Save/ }));
      await waitFor(() =>
        expect(screen.getByText("That name is taken.")).toBeInTheDocument(),
      );

      await user.type(
        screen.getByRole("textbox", { name: "Display name" }),
        "2",
      );

      expect(screen.queryByText("That name is taken.")).toBeNull();
    });

    it("keeps the page dirty and reports a thrown save", async () => {
      const onsave = vi.fn();
      render(SettingsPage, {
        save: () => {
          throw new Error("offline");
        },
        onsave,
      });
      await typeName("Q");
      await user.click(screen.getByRole("button", { name: /Save/ }));
      await waitFor(() => expect(onsave).toHaveBeenCalled());
      expect(onsave.mock.calls[0][0]).toMatchObject({ ok: false });
      expect(bar()).not.toHaveAttribute("inert");
    });
  });

  describe("reset to default", () => {
    it("offers a reset only for a value that differs from its default", () => {
      render(SettingsPage);
      // "Priya" differs from the default "", the email toggle does not.
      expect(
        screen.getAllByRole("button", { name: "Reset to default" }),
      ).toHaveLength(1);
    });

    it("restores the default and moves focus to the control", async () => {
      render(SettingsPage);
      await user.click(
        screen.getByRole("button", { name: "Reset to default" }),
      );

      const input = screen.getByRole("textbox", { name: "Display name" });
      expect(input).toHaveValue("");
      await waitFor(() => expect(input).toHaveFocus());
      expect(
        screen.queryByRole("button", { name: "Reset to default" }),
      ).toBeNull();
    });
  });

  describe("locked setting", () => {
    it("disables the control and keeps a focusable explanation", () => {
      render(SettingsPage, { locked: true });
      expect(
        screen.getByRole("switch", { name: "Email alerts" }),
      ).toBeDisabled();
      const lock = screen.getByRole("button", { name: "Locked" });
      expect(lock).not.toBeDisabled();
      expect(
        document.querySelector('[data-settings-row="email"]'),
      ).toHaveTextContent("Managed by your organization");
    });
  });

  describe("search", () => {
    it("hides rows and sections that do not match and highlights the match", async () => {
      render(SettingsPage, { query: "name" });
      await flushMacrotask();

      await waitFor(() =>
        expect(document.getElementById("alerts")).toHaveAttribute("hidden"),
      );
      expect(
        document.querySelector('[data-settings-row="email"]'),
      ).toHaveAttribute("hidden");
      const mark = document.querySelector('[data-settings-row="name"] mark');
      expect(mark).toHaveTextContent("name");
      expect(
        screen.queryByRole("link", { name: "Alerts" }),
      ).not.toBeInTheDocument();
    });

    it("matches a keyword the label does not say", async () => {
      render(SettingsPage, { query: "nickname" });
      await waitFor(() =>
        expect(
          document.querySelector('[data-settings-row="email"]'),
        ).toHaveAttribute("hidden"),
      );
      expect(
        document.querySelector('[data-settings-row="name"]'),
      ).not.toHaveAttribute("hidden");
    });

    it("keeps hidden controls mounted and bound", async () => {
      const { component } = render(SettingsPage, { query: "alerts" });
      await waitFor(() =>
        expect(
          document.querySelector('[data-settings-row="name"]'),
        ).toHaveAttribute("hidden"),
      );
      expect(get(component.settings.values).name).toBe("Priya");
    });
  });

  describe("leaving", () => {
    function unload() {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event;
    }

    it("asks the browser to confirm while there are unsaved changes", async () => {
      render(SettingsPage);
      expect(unload().defaultPrevented).toBe(false);
      await typeName("Q");
      expect(unload().defaultPrevented).toBe(true);
    });

    it("stops asking once the changes are saved", async () => {
      render(SettingsPage);
      await typeName("Q");
      await user.click(screen.getByRole("button", { name: /Save/ }));
      await waitFor(() => expect(unload().defaultPrevented).toBe(false));
    });

    it("answers a leave guard with the discard prompt", async () => {
      const { component } = render(SettingsPage);
      await typeName("Q");

      const leaving = component.settings.unsaved.guard();
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveTextContent("Discard unsaved changes?");
      await user.click(within(dialog).getByRole("button", { name: "Discard" }));

      await expect(leaving).resolves.toBe(true);
    });

    it("lets go of the page's beforeunload guard when it unmounts", async () => {
      const { unmount } = render(SettingsPage);
      await typeName("Q");
      unmount();
      expect(unload().defaultPrevented).toBe(false);
    });
  });

  describe("section navigation", () => {
    it("moves focus to the section heading on a deep link", async () => {
      window.location.hash = "#alerts";
      render(SettingsPage);
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Alerts" })).toHaveFocus(),
      );
      window.location.hash = "";
    });

    it("lists the sections as links to their ids", () => {
      render(SettingsPage);
      expect(screen.getByRole("link", { name: "Alerts" })).toHaveAttribute(
        "href",
        "#alerts",
      );
      expect(document.getElementById("alerts")).toBeInTheDocument();
    });
  });
});
