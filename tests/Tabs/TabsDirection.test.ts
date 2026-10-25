import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import TabsDirection from "./TabsDirection.test.svelte";

/** Press a key, then wait for the tab named `name` to take focus. */
async function press(key: string, name: string) {
  await user.keyboard(`{${key}}`);
  await waitFor(() => expect(screen.getByRole("tab", { name })).toHaveFocus());
}

describe("Tabs writing direction", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  it.each([
    ["Tabs", undefined],
    ["TabsVertical in a row", "horizontal" as const],
  ])("swaps Left and Right in RTL (%s)", async (_name, vertical) => {
    render(TabsDirection, { props: { vertical } });
    screen.getByRole("tab", { name: "Overview" }).focus();

    await press("ArrowLeft", "Logs");
    await press("ArrowLeft", "Settings");
    await press("ArrowRight", "Logs");
    await press("ArrowRight", "Overview");
    await press("ArrowRight", "Settings");
    await press("Home", "Overview");
    await press("End", "Settings");
  });

  it("keeps Up and Down in a vertical TabsVertical", async () => {
    render(TabsDirection, { props: { vertical: "vertical" } });
    screen.getByRole("tab", { name: "Overview" }).focus();

    await press("ArrowDown", "Logs");
    await press("ArrowUp", "Overview");
  });

  it("lets a LayoutDirection win over the computed direction", async () => {
    document.documentElement.style.direction = "rtl";
    render(TabsDirection, { props: { dir: "ltr" } });
    screen.getByRole("tab", { name: "Overview" }).focus();

    await press("ArrowRight", "Logs");
  });

  it("lets a plain dir inside a LayoutDirection win", async () => {
    render(TabsDirection, { props: { innerDir: "ltr" } });
    screen.getByRole("tab", { name: "Overview" }).focus();

    await press("ArrowRight", "Logs");
    await press("ArrowLeft", "Overview");
  });

  it("reads a page direction change on the next key", async () => {
    render(TabsDirection, { props: { context: false } });
    screen.getByRole("tab", { name: "Overview" }).focus();
    await press("ArrowRight", "Logs");

    document.documentElement.style.direction = "rtl";
    await press("ArrowRight", "Overview");
  });
});
