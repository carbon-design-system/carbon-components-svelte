import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenuClose from "./ContextMenuClose.test.svelte";

describe("ContextMenu close trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should surface 'escape-key' when closed via Escape", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.keyboard("{Escape}");
    expect(consoleLog).toHaveBeenCalledWith("close", "escape-key");
  });

  it("should surface 'outside-click' when closed via clicking outside", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.click(document.body);
    expect(consoleLog).toHaveBeenCalledWith("close", "outside-click");
  });

  it("should surface 'select' when closed by selecting an option", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.click(screen.getByText("Option 1"));
    expect(consoleLog).toHaveBeenCalledWith("close", "select");
  });
});
