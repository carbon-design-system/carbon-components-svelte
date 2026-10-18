import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { TYPEAHEAD_RESET_MS } from "../../src/constants/timing.js";
import Fixture from "./HeaderNavMenubar.test.svelte";

const items = [
  { text: "Home" },
  {
    text: "Tools",
    items: [{ text: "Alpha" }, { text: "Beta" }, { text: "Bravo" }],
  },
  { text: "Docs" },
];

const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNav typeahead", () => {
  // Fake timers stand in for the idle wait; user-event needs to advance them.
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("focuses the next top-level item starting with the typed letter", async () => {
    render(Fixture, { props: { items } });

    item("Home").focus();
    await user.keyboard("t");
    expect(item("Tools")).toHaveFocus();
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS);
    await user.keyboard("d");
    expect(item("Docs")).toHaveFocus();
  });

  it("focuses the next menu item starting with the typed letter", async () => {
    render(Fixture, { props: { items } });

    item("Tools").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Alpha")).toHaveFocus();

    await user.keyboard("b");
    expect(item("Beta")).toHaveFocus();
    // Typing after the reset window starts a new query.
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS);
    await user.keyboard("b");
    expect(item("Bravo")).toHaveFocus();
    expect(item("Tools")).toHaveAttribute("aria-expanded", "true");
  });

  it("matches multiple typed letters", async () => {
    render(Fixture, { props: { items } });

    item("Tools").focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("br");
    expect(item("Bravo")).toHaveFocus();
  });
});
