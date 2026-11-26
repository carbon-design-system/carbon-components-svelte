import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ShortcutHelp from "./ShortcutHelp.test.svelte";
import ShortcutHelpEmpty from "./ShortcutHelpEmpty.test.svelte";

// Registrations reach the help sheet one microtask after they are made.
const settle = async () => {
  await tick();
  await tick();
};

const rows = () =>
  [...document.querySelectorAll(".bx--description-list-item")].map((item) => [
    item.querySelector("dt")?.textContent,
    item.querySelector(".bx--visually-hidden")?.textContent,
  ]);

const headings = () =>
  [...document.querySelectorAll("h3")].map((heading) =>
    heading.textContent?.trim(),
  );

describe("ShortcutHelp", () => {
  it("opens with ? and closes with ? or Escape", async () => {
    render(ShortcutHelp);
    await settle();
    const dialog = () =>
      screen.queryByRole("dialog", { name: "Keyboard shortcuts" });
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");

    await user.keyboard("?");
    expect(document.querySelector(".bx--modal")).toHaveClass("is-visible");
    expect(dialog()).toBeInTheDocument();

    await user.keyboard("?");
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");

    await user.keyboard("?");
    await user.keyboard("{Escape}");
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
  });

  it("does not open while the user types a ?", async () => {
    render(ShortcutHelp);
    await settle();

    await user.click(screen.getByTestId("field"));
    await user.keyboard("?");

    expect(screen.getByTestId("field")).toHaveValue("?");
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
  });

  it("follows the shortcut prop, and none when it is empty", async () => {
    const { rerender } = render(ShortcutHelp, { props: { helpKeys: "" } });
    await settle();
    await user.keyboard("?");
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");

    await rerender({ helpKeys: "mod+/" });
    await user.keyboard("{Control>}/{/Control}");
    expect(document.querySelector(".bx--modal")).toHaveClass("is-visible");
  });

  it("lists the registered shortcuts with their keys, itself included", async () => {
    render(ShortcutHelp, { props: { open: true } });
    await settle();

    expect(headings()).toEqual(["General"]);
    expect(rows()).toEqual([
      ["Open command palette", "Control K"],
      ["Save draft", "Control S"],
      ["Show keyboard shortcuts", "?"],
    ]);
  });

  it("groups a shown scope first, and drops the keys it shadows", async () => {
    render(ShortcutHelp, { props: { open: true, scoped: true } });
    await settle();

    expect(headings()).toEqual(["Edit profile", "General"]);
    const labels = rows().map(([label]) => label);
    expect(labels).toEqual([
      "Save profile",
      "Open command palette",
      "Show keyboard shortcuts",
    ]);
  });

  it("leaves out a shortcut whose element is disabled", async () => {
    render(ShortcutHelp, { props: { open: true, disabled: true } });
    await settle();

    expect(rows().map(([label]) => label)).not.toContain(
      "Open command palette",
    );
  });

  it("shows the empty text when nothing is available", async () => {
    render(ShortcutHelpEmpty);
    await settle();

    expect(screen.getByText("Nothing to press here.")).toBeInTheDocument();
    expect(rows()).toEqual([]);
  });
});
