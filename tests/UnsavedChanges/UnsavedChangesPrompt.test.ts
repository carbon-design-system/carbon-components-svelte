import { render, screen, waitFor } from "@testing-library/svelte";
import { get } from "svelte/store";
import { createUnsavedChanges } from "../../src/UnsavedChanges/unsaved-changes.js";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import Dialogs from "./UnsavedChangesDialogs.test.svelte";
import Prompt from "./UnsavedChangesPrompt.test.svelte";

describe("UnsavedChangesPrompt", () => {
  it("renders nothing until the first request", () => {
    const store = createUnsavedChanges();
    const { container } = render(Prompt, { store });

    expect(container.querySelector(".bx--modal")).toBeNull();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("answers guard() true when the user discards", async () => {
    const store = createUnsavedChanges();
    render(Prompt, { store });
    store.set("a", true);

    const decision = store.guard();
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveAccessibleName("Discard unsaved changes?");
    screen.getByText("Your changes will be lost.");

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(await decision).toBe(true);
    expect(get(store.dirty)).toBe(false);
  });

  it.each([
    ["Keep editing", () => user.click(screen.getByText("Keep editing"))],
    [
      "the close button",
      () => user.click(screen.getByLabelText("Close the modal")),
    ],
    ["Escape", () => user.keyboard("{Escape}")],
  ])(
    "answers guard() false on %s and keeps the changes",
    async (_, dismiss) => {
      const store = createUnsavedChanges();
      render(Prompt, { store });
      store.set("a", true);

      const decision = store.guard();
      await screen.findByRole("alertdialog");
      await dismiss();

      expect(await decision).toBe(false);
      expect(get(store.dirty)).toBe(true);
    },
  );

  it("asks again on the next guard() after an answer", async () => {
    const store = createUnsavedChanges();
    render(Prompt, { store });
    store.set("a", true);

    const first = store.guard();
    await screen.findByRole("alertdialog");
    await user.click(screen.getByText("Keep editing"));
    expect(await first).toBe(false);
    await flushMacrotask();

    const second = store.guard();
    await user.click(await screen.findByRole("button", { name: "Discard" }));
    expect(await second).toBe(true);
  });

  it("ignores a second prompt for the same store", async () => {
    const store = createUnsavedChanges();
    render(Prompt, { store, copies: 2 });
    store.set("a", true);

    store.guard();
    await screen.findByRole("alertdialog");
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
  });

  it("opens over a dialog without closing it", async () => {
    const store = createUnsavedChanges();
    render(Dialogs, { store });
    store.set("a", true);

    store.guard();
    await screen.findByRole("alertdialog");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("applies a custom title and body", async () => {
    const store = createUnsavedChanges();
    render(Prompt, {
      store,
      title: "Leave this page?",
      confirmText: "Leave",
      body: "Edits to the profile are not saved.",
    });
    store.set("a", true);

    store.guard();
    await screen.findByRole("alertdialog", { name: "Leave this page?" });
    screen.getByRole("button", { name: "Leave" });
    screen.getByText("Edits to the profile are not saved.");
  });
});

describe("guarding a dialog's close event", () => {
  const kinds = ["modal", "composed", "sidepanel"] as const;

  it.each(kinds)(
    "%s: Escape on a clean form closes it without asking",
    async (kind) => {
      const store = createUnsavedChanges();
      render(Dialogs, { store, kind });
      await user.click(screen.getByLabelText("Name"));

      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.getByTestId("open")).toHaveTextContent("false"),
      );
      expect(screen.queryByRole("alertdialog")).toBeNull();
    },
  );

  it.each(kinds)(
    "%s: Escape on a dirty form asks and Keep editing leaves it open",
    async (kind) => {
      const store = createUnsavedChanges();
      render(Dialogs, { store, kind });
      const input = screen.getByLabelText("Name");
      await user.type(input, "!");

      await user.keyboard("{Escape}");
      await screen.findByRole("alertdialog");
      expect(screen.getByTestId("open")).toHaveTextContent("true");

      await user.click(screen.getByText("Keep editing"));
      await waitFor(() => expect(input).toHaveFocus());
      expect(screen.getByTestId("open")).toHaveTextContent("true");
      expect(input).toHaveValue("Ada!");
    },
  );

  it.each(kinds)(
    "%s: Discard closes it and the saved values are the baseline",
    async (kind) => {
      const store = createUnsavedChanges();
      render(Dialogs, { store, kind });
      await user.type(screen.getByLabelText("Name"), "!");

      await user.keyboard("{Escape}");
      await user.click(await screen.findByRole("button", { name: "Discard" }));

      await waitFor(() =>
        expect(screen.getByTestId("open")).toHaveTextContent("false"),
      );
      await flushMacrotask();
      expect(screen.getByTestId("name")).toHaveTextContent("Ada");
      expect(get(store.dirty)).toBe(false);

      // Reopened, the form is tracked against the restored values.
      await user.click(screen.getByRole("button", { name: "Reopen" }));
      const input = screen.getByLabelText("Name");
      await user.type(input, "!");
      expect(get(store.dirty)).toBe(true);
      await user.type(input, "{Backspace}");
      expect(get(store.dirty)).toBe(false);
    },
  );

  it("Modal: the footer Cancel button goes through the same guard", async () => {
    const store = createUnsavedChanges();
    render(Dialogs, { store, kind: "modal" });
    await user.type(screen.getByLabelText("Name"), "!");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await screen.findByRole("alertdialog");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });
});
