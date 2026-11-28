import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TabsHashLinked from "./TabsHashLinked.test.svelte";

function setUrl(url: string) {
  history.replaceState(null, "", url);
}

function tab(name: string) {
  return screen.getByRole("tab", { name });
}

async function settle() {
  await tick();
  await tick();
}

describe("Tabs hashLinked", () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoView = vi.fn();
    // jsdom has no `scrollIntoView`.
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    setUrl("/");
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("selects and scrolls to the tab the hash names after mount", async () => {
    setUrl("/#activity");
    render(TabsHashLinked);

    await waitFor(() =>
      expect(tab("Activity")).toHaveAttribute("aria-selected", "true"),
    );
    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.contexts[0]).toBe(tab("Activity"));
    expect(tab("Activity")).not.toHaveFocus();
  });

  it("sets a bound `selectedId` from the hash", async () => {
    setUrl("/#settings");
    render(TabsHashLinked, { props: { selectedId: "overview" } });

    await waitFor(() =>
      expect(screen.getByTestId("selected-id")).toHaveTextContent("settings"),
    );
    expect(tab("Settings")).toHaveAttribute("aria-selected", "true");
  });

  it("replaces the hash on selection and keeps the rest of the URL", async () => {
    setUrl("/page?view=compact");
    const replaceState = vi.spyOn(history, "replaceState");
    const length = history.length;
    render(TabsHashLinked);
    await settle();
    // The selection linking starts with is not written.
    expect(window.location.hash).toBe("");

    await user.click(tab("Settings"));
    expect(window.location.pathname + window.location.search).toBe(
      "/page?view=compact",
    );
    expect(window.location.hash).toBe("#settings");
    expect(history.length).toBe(length);
    expect(replaceState).toHaveBeenCalledOnce();
    replaceState.mockRestore();
  });

  it("follows `hashchange`", async () => {
    render(TabsHashLinked);
    await settle();

    setUrl("/#settings");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await settle();
    expect(tab("Settings")).toHaveAttribute("aria-selected", "true");
    // Only the hash on mount scrolls; the browser scrolls on `hashchange`.
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it.each([
    ["no tab", "/#release-notes"],
    ["a disabled tab", "/#billing"],
  ])("ignores a hash that names %s", async (_, url) => {
    setUrl(url);
    render(TabsHashLinked);
    await settle();

    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(url.slice(1));
  });

  it("neither reads nor writes the hash unless set", async () => {
    setUrl("/#activity");
    render(TabsHashLinked, { props: { hashLinked: false } });
    await settle();
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");

    await user.click(tab("Settings"));
    expect(window.location.hash).toBe("#activity");
  });
});
