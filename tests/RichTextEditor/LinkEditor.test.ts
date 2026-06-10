import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import LinkEditor from "./LinkEditor.test.svelte";

const executed = (calls: unknown[][], command: string) =>
  calls.filter(([event, name]) => event === "execute" && name === command);

describe("LinkEditor", () => {
  it("renders a collapsed trigger with an accessible name", () => {
    render(LinkEditor);

    const trigger = screen.getByRole("button", { name: "Insert link" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the URL popover when activated", async () => {
    render(LinkEditor);

    await user.click(screen.getByRole("button", { name: "Insert link" }));

    expect(screen.getByRole("button", { name: "Insert link" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("applies a link with the entered URL and closes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(LinkEditor);

    await user.click(screen.getByRole("button", { name: "Insert link" }));
    await user.type(screen.getByRole("textbox"), "https://carbon.com");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    const calls = executed(consoleLog.mock.calls, "createLink");
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.at(-1)?.[2]).toBe("https://carbon.com");
    expect(screen.getByRole("button", { name: "Insert link" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("removes a link via the remove action", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(LinkEditor);

    await user.click(screen.getByRole("button", { name: "Insert link" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(executed(consoleLog.mock.calls, "unlink").length).toBeGreaterThan(0);
  });

  it("closes on Escape without throwing when there is no selection", async () => {
    render(LinkEditor);

    const trigger = screen.getByRole("button", { name: "Insert link" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
