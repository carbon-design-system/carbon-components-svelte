import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import RichTextEditorByo from "./RichTextEditorByo.test.svelte";

const hasExecute = (calls: unknown[][], command: string) =>
  calls.some(([event, name]) => event === "execute" && name === command);

describe("RichTextEditor bring-your-own editor", () => {
  it("delivers the same command object to a consumer-supplied adapter", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RichTextEditorByo);

    await user.click(screen.getByRole("button", { name: "Link" }));

    const createLink = consoleLog.mock.calls.find(
      ([event, name]) => event === "execute" && name === "createLink",
    );
    expect(createLink?.[2]).toBe("https://x.com");
  });

  it("drives aria-pressed from the adapter's reported active set", () => {
    render(RichTextEditorByo, { props: { active: ["bold"] } });

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("stops delivering commands once the adapter unregisters", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(RichTextEditorByo);

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(hasExecute(consoleLog.mock.calls, "bold")).toBe(true);

    consoleLog.mockClear();
    component.mounted = false;
    await tick();

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(hasExecute(consoleLog.mock.calls, "bold")).toBe(false);
  });
});
