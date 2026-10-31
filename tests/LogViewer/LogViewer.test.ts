import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import LogViewer from "./LogViewer.test.svelte";

const ESC = "\u001b";

async function toggleLevel(name: string) {
  await user.click(screen.getByRole("button", { name: /^Levels/ }));
  await user.click(
    screen.getByRole("menuitemcheckbox", { name: new RegExp(`^${name}`) }),
  );
}

function numbered(count: number) {
  return Array.from({ length: count }, (_, i) => `line ${i + 1}`);
}

function rows() {
  return [...document.querySelectorAll<HTMLElement>("[data-line-id]")];
}

function lineIds() {
  return rows().map((row) => Number(row.dataset.lineId));
}

function log() {
  return screen.getByRole("log", { name: "Build output" });
}

describe("LogViewer", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
  });

  it("is a focusable, named log that is not itself a live region", () => {
    render(LogViewer, { props: { lines: numbered(3) } });

    const region = log();
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("aria-live", "off");
  });

  it("draws a window of a long log, starting at the newest line", () => {
    render(LogViewer, { props: { lines: numbered(5000) } });

    expect(rows().length).toBeGreaterThan(0);
    expect(rows().length).toBeLessThan(200);
    expect(rows().length).toBeLessThan(5000);
  });

  it("moves a timestamp and level out of the text into the gutter", () => {
    render(LogViewer, {
      props: { lines: ["2026-10-27T09:41:07Z ERROR disk full"] },
    });

    const row = rows()[0];
    expect(row).toHaveClass("bx--log-viewer__line--error");
    expect(within(row).getByText("ERROR")).toHaveClass("bx--log-viewer__level");
    expect(row.querySelector(".bx--log-viewer__text")).toHaveTextContent(
      /^disk full$/,
    );
  });

  it("draws ANSI colors from the themed palette and drops the escapes", () => {
    render(LogViewer, {
      props: { lines: [`ok ${ESC}[31mfailed${ESC}[0m ${ESC}[1mdone${ESC}[0m`] },
    });

    const text = rows()[0].querySelector(".bx--log-viewer__text");
    expect(text).toHaveTextContent("ok failed done");
    expect(within(text as HTMLElement).getByText("failed")).toHaveStyle({
      color: "var(--ccs-log-ansi-1)",
    });
    expect(within(text as HTMLElement).getByText("done")).toHaveStyle({
      fontWeight: "600",
    });
  });

  it("draws text on a background in a color that reads on it", () => {
    render(LogViewer, {
      props: {
        lines: [
          `${ESC}[97;41mwhite on red${ESC}[0m ${ESC}[48;2;250;250;250mpale${ESC}[0m ${ESC}[48;2;10;10;80mdeep${ESC}[0m ${ESC}[32;41mgreen on red${ESC}[0m`,
        ],
      },
    });

    expect(screen.getByText("white on red")).toHaveStyle({
      color: "var(--ccs-log-ansi-on-1)",
    });
    expect(screen.getByText("pale")).toHaveStyle({ color: "#161616" });
    expect(screen.getByText("deep")).toHaveStyle({ color: "#ffffff" });
    // A hue the producer chose is theirs to pair.
    expect(screen.getByText("green on red")).toHaveStyle({
      color: "var(--ccs-log-ansi-2)",
    });
  });

  it("links URLs and opens them safely", () => {
    render(LogViewer, {
      props: { lines: ["see https://example.com/x for details"] },
    });

    const link = screen.getByRole("link", { name: "https://example.com/x" });
    expect(link).toHaveAttribute("href", "https://example.com/x");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  describe("appending", () => {
    it("adds lines pushed with append, one update per frame", async () => {
      const { component } = render(LogViewer, {
        props: { lines: numbered(2) },
      });

      component.viewer?.append(["pushed 1", "pushed 2"]);
      component.viewer?.append("pushed 3");
      expect(screen.queryByText("pushed 3")).not.toBeInTheDocument();
      await nextFrame();
      await tick();

      expect(screen.getByText("pushed 3")).toBeInTheDocument();
      expect(lineIds()).toEqual([0, 1, 2, 3, 4]);
    });

    it("reads only the new lines when the array grows", async () => {
      const first = numbered(3);
      const { rerender } = render(LogViewer, { props: { lines: first } });

      await rerender({ lines: [...first, "line 4"] });

      expect(lineIds()).toEqual([0, 1, 2, 3]);
      expect(screen.getByText("line 4")).toBeInTheDocument();
    });

    it("reads a replaced array whole", async () => {
      const { rerender } = render(LogViewer, { props: { lines: numbered(3) } });

      await rerender({ lines: ["fresh"] });

      expect(lineIds()).toEqual([0]);
      expect(screen.getByText("fresh")).toBeInTheDocument();
    });

    it("drops the oldest lines past maxLines and keeps numbering", async () => {
      const { component } = render(LogViewer, {
        props: { lines: numbered(5), maxLines: 3 },
      });

      expect(lineIds()).toEqual([2, 3, 4]);
      component.viewer?.append("line 6");
      await nextFrame();
      await tick();

      expect(lineIds()).toEqual([3, 4, 5]);
      expect(rows()[0].querySelector("[data-line]")).toHaveAttribute(
        "data-line",
        "4",
      );
    });

    it("empties on clear", async () => {
      const { component } = render(LogViewer, {
        props: { lines: numbered(3) },
      });

      component.viewer?.clear();
      await tick();

      expect(rows()).toHaveLength(0);
      expect(screen.getByText("No log lines")).toBeInTheDocument();
    });
  });

  describe("following", () => {
    function scrollAway(top: number) {
      const region = log();
      Object.defineProperty(region, "scrollHeight", {
        value: 10000,
        configurable: true,
      });
      Object.defineProperty(region, "clientHeight", {
        value: 400,
        configurable: true,
      });
      region.scrollTop = top;
      return fireEvent.scroll(region);
    }

    it("stops following when the reader scrolls up, and offers the way back", async () => {
      render(LogViewer, { props: { lines: numbered(500) } });
      await scrollAway(9600);
      await scrollAway(5000);

      expect(screen.getByTestId("follow")).toHaveTextContent("false");
      expect(
        screen.getByRole("button", { name: "Jump to latest" }),
      ).toBeInTheDocument();
    });

    it("counts the lines that arrive while the reader is away", async () => {
      const { component } = render(LogViewer, {
        props: { lines: numbered(500) },
      });
      await scrollAway(9600);
      await scrollAway(5000);
      await tick();

      component.viewer?.append(["a", "b", "c"]);
      await nextFrame();
      await tick();

      expect(
        screen.getByRole("button", { name: "Jump to latest (3 new)" }),
      ).toBeInTheDocument();
    });

    it("follows again on Jump to latest, and when scrolled back to the end", async () => {
      render(LogViewer, { props: { lines: numbered(500) } });
      await scrollAway(9600);
      await scrollAway(5000);

      await user.click(screen.getByRole("button", { name: "Jump to latest" }));
      expect(screen.getByTestId("follow")).toHaveTextContent("true");
      expect(
        screen.queryByRole("button", { name: /Jump to latest/ }),
      ).not.toBeInTheDocument();

      await scrollAway(9600);
      await scrollAway(5000);
      await scrollAway(9590);
      expect(screen.getByTestId("follow")).toHaveTextContent("true");
    });
  });

  describe("search", () => {
    const lines = ["alpha one", "beta", "alpha two alpha", "gamma"];

    it("highlights matches and counts them", async () => {
      render(LogViewer, { props: { lines } });

      await user.type(screen.getByRole("searchbox"), "alpha");

      expect(document.querySelectorAll(".bx--log-viewer__mark")).toHaveLength(
        3,
      );
      expect(
        document.querySelector(".bx--log-viewer__count"),
      ).toHaveTextContent("1 of 3");
    });

    it("steps through matches with Enter and Shift+Enter", async () => {
      render(LogViewer, { props: { lines } });
      const search = screen.getByRole("searchbox");
      await user.type(search, "alpha");
      const count = document.querySelector(".bx--log-viewer__count");

      await user.type(search, "{Enter}");
      expect(count).toHaveTextContent("2 of 3");
      await user.type(search, "{Shift>}{Enter}{/Shift}");
      expect(count).toHaveTextContent("1 of 3");
      await user.type(search, "{Shift>}{Enter}{/Shift}");
      expect(count).toHaveTextContent("3 of 3");
      expect(
        document.querySelectorAll(".bx--log-viewer__mark--current"),
      ).toHaveLength(1);
    });

    it("reads a regular expression, and reports one that does not parse", async () => {
      const { rerender } = render(LogViewer, {
        props: { lines, regex: true },
      });
      const search = screen.getByRole("searchbox");

      await user.type(search, "al.ha");
      expect(
        document.querySelector(".bx--log-viewer__count"),
      ).toHaveTextContent("1 of 3");

      await user.clear(search);
      await user.type(search, "(");
      expect(
        screen.getByText("Not a valid regular expression"),
      ).toBeInTheDocument();
      await rerender({ regex: false });
      expect(screen.queryByText("Not a valid regular expression")).toBeNull();
    });

    it("says when nothing matches", async () => {
      render(LogViewer, { props: { lines } });

      await user.type(screen.getByRole("searchbox"), "zzz");

      expect(
        document.querySelector(".bx--log-viewer__count"),
      ).toHaveTextContent("No results");
      expect(
        screen.getByRole("button", { name: "Next match" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("levels", () => {
    const lines = ["ERROR boom", "INFO fine", "WARN hmm", "DEBUG noise"];

    it("counts each level in its filter menu", async () => {
      render(LogViewer, { props: { lines } });

      await user.click(screen.getByRole("button", { name: "Levels" }));
      expect(
        screen
          .getAllByRole("menuitemcheckbox")
          .map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
      ).toEqual(["DEBUG 1", "INFO 1", "WARN 1", "ERROR 1"]);
    });

    it("hides the lines of a level that is turned off", async () => {
      render(LogViewer, { props: { lines } });

      await toggleLevel("ERROR");

      expect(screen.queryByText("boom")).not.toBeInTheDocument();
      expect(screen.getByText("fine")).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemcheckbox", { name: /^ERROR/ }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("button", { name: "Levels (3/4)" }),
      ).toBeInTheDocument();
    });

    it("can start with a level hidden", () => {
      render(LogViewer, {
        props: { lines, levels: ["error", "warn"] },
      });

      expect(screen.getByText("boom")).toBeInTheDocument();
      expect(screen.queryByText("noise")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Levels (2/4)" }),
      ).toBeInTheDocument();
    });
  });

  describe("selecting and copying", () => {
    async function selectLine(number: number, shift = false) {
      const button = document.querySelector<HTMLElement>(
        `[data-line="${number}"]`,
      );
      assert(button);
      await fireEvent.click(button, { shiftKey: shift });
    }

    it("selects a line from its number and a range with Shift", async () => {
      render(LogViewer, { props: { lines: numbered(10) } });

      await selectLine(3);
      expect(screen.getByTestId("selection")).toHaveTextContent(
        '{"start":2,"end":2}',
      );
      await selectLine(6, true);

      expect(screen.getByTestId("selection")).toHaveTextContent(
        '{"start":2,"end":5}',
      );
      expect(
        document.querySelectorAll(".bx--log-viewer__line--selected"),
      ).toHaveLength(4);
    });

    it("clears the selection on a second click and on Escape", async () => {
      render(LogViewer, { props: { lines: numbered(5) } });

      await selectLine(2);
      await selectLine(2);
      expect(screen.getByTestId("selection")).toHaveTextContent("null");

      await selectLine(2);
      await fireEvent.keyDown(log(), { key: "Escape" });
      expect(screen.getByTestId("selection")).toHaveTextContent("null");
    });

    it("selects every line shown with Ctrl+A", async () => {
      render(LogViewer, { props: { lines: ["ERROR a", "INFO b", "INFO c"] } });
      await toggleLevel("ERROR");

      await fireEvent.keyDown(log(), { key: "a", ctrlKey: true });

      expect(screen.getByTestId("selection")).toHaveTextContent(
        '{"start":1,"end":2}',
      );
    });

    it("copies the selected lines without colors, or every line shown", async () => {
      const { component } = render(LogViewer, {
        props: {
          lines: ["one", `${ESC}[31mtwo${ESC}[0m`, "three", "four"],
        },
      });

      expect(component.viewer?.getText()).toBe("one\ntwo\nthree\nfour");

      await selectLine(2);
      await selectLine(3, true);
      expect(component.viewer?.getText()).toBe("two\nthree");

      await user.click(screen.getByRole("button", { name: "Copy lines" }));
      expect(writeText).toHaveBeenCalledWith("two\nthree");
      expect(screen.getByTestId("copied")).toHaveTextContent("1");
    });

    it("copies with Ctrl+C when lines are selected", async () => {
      render(LogViewer, { props: { lines: numbered(4) } });

      await selectLine(1);
      await selectLine(2, true);
      await fireEvent.keyDown(log(), { key: "c", ctrlKey: true });
      await tick();

      expect(writeText).toHaveBeenCalledWith("line 1\nline 2");
    });
  });

  describe("announcements", () => {
    afterEach(vi.useRealTimers);

    it("summarizes new lines in a separate status region, at most once per interval", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const { component } = render(LogViewer, {
        props: { lines: numbered(2) },
      });

      component.viewer?.append(["INFO a", "ERROR b", "INFO c"]);
      component.viewer?.append("WARN d");
      const [announcement] = document.querySelectorAll(
        ".bx--log-viewer > [role=status]",
      );
      expect(announcement.textContent?.trim()).toBe("");

      await vi.advanceTimersByTimeAsync(2000);
      expect(announcement).toHaveTextContent("4 new lines, 1 error, 1 warning");
    });
  });
});
