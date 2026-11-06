import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import WebTerminal from "./WebTerminal.test.svelte";

const ESC = "\u001b";

function output() {
  return screen.getByRole("log", { name: "Shell output" });
}

function input() {
  return screen.getByRole("textbox", { name: "Command" }) as HTMLInputElement;
}

function rowTexts() {
  return [...document.querySelectorAll<HTMLElement>("[data-line-id]")].map(
    (row) => row.textContent?.replace(/\s+/g, " ").trim(),
  );
}

async function settle() {
  await nextFrame();
  await tick();
}

async function enter(command: string) {
  await user.click(input());
  await user.type(input(), `${command}{Enter}`);
  await settle();
}

function status() {
  return screen
    .getByTestId("terminal")
    .querySelector(":scope > [role='status']") as HTMLElement;
}

describe("WebTerminal", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
  });

  describe("semantics", () => {
    it("is a named log that is not itself live, with a labelled command line", () => {
      render(WebTerminal);

      expect(output()).toHaveAttribute("aria-live", "off");
      expect(output()).toHaveAttribute("tabindex", "0");
      expect(screen.getByRole("group", { name: "Shell" })).toBeInTheDocument();
      expect(input()).toHaveAccessibleDescription(
        /Enter to run.*Up and Down arrows browse history.*Control C cancels/s,
      );
    });

    it("names Tab and Escape in the description only when it completes", () => {
      const { unmount } = render(WebTerminal);
      expect(input()).not.toHaveAccessibleDescription(/Tab/);
      unmount();

      render(WebTerminal, { props: { complete: () => [] } });
      expect(input()).toHaveAccessibleDescription(/Escape, then Tab/);
    });

    it("renders in a dark zone, or a light palette for a light theme", () => {
      const { unmount } = render(WebTerminal);
      const root = screen.getByTestId("terminal");
      expect(root).toHaveClass("bx--g100", "bx--web-terminal");
      expect(root).not.toHaveClass("bx--web-terminal--light");
      unmount();

      render(WebTerminal, { props: { theme: "white" } });
      expect(screen.getByTestId("terminal")).toHaveClass(
        "bx--white",
        "bx--web-terminal--light",
      );
    });
  });

  describe("running commands", () => {
    it("echoes the command, runs it, and prints a returned string", async () => {
      const execute = vi.fn((command: string) => `ran ${command}`);
      render(WebTerminal, { props: { execute } });

      await enter("ls -la");

      expect(execute).toHaveBeenCalledWith(
        "ls -la",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(rowTexts()).toEqual(["$ ls -la", "ran ls -la"]);
      expect(input()).toHaveValue("");
      expect(screen.getByTestId("events")).toHaveTextContent(
        "command:ls -la finish:ok:1",
      );
    });

    it("streams an async generator and ends the row a stream left open", async () => {
      async function* logs() {
        yield "one\ntw";
        yield "o\nthree";
      }
      render(WebTerminal, { props: { execute: () => logs() } });

      await enter("logs");
      await waitFor(() =>
        expect(rowTexts()).toEqual(["$ logs", "one", "two", "three"]),
      );
      expect(screen.getByTestId("running")).toHaveTextContent("false");
    });

    it("reads short output in full and long output as a count", async () => {
      render(WebTerminal, {
        props: {
          execute: (command: string) =>
            command === "short" ? "4" : "x\n".repeat(20),
        },
      });

      await enter("short");
      await waitFor(() => expect(status()).toHaveTextContent("4"));

      await enter("long");
      await waitFor(() =>
        expect(status()).toHaveTextContent("Command finished, 20 lines"),
      );
    });

    it("prints a thrown error in red and says the command failed", async () => {
      render(WebTerminal, {
        props: {
          execute: () => {
            throw new Error("pod not found");
          },
          announceLines: 0,
        },
      });

      await enter("get pod");

      await waitFor(() => expect(rowTexts()).toContain("pod not found"));
      expect(screen.getByText("pod not found")).toHaveStyle({
        color: "var(--ccs-term-ansi-1)",
      });
      expect(screen.getByTestId("events")).toHaveTextContent("finish:error:1");
      await waitFor(() =>
        expect(status()).toHaveTextContent("Command failed, 1 line"),
      );
    });

    it("keeps the input readonly while a command runs, and ignores Enter", async () => {
      const execute = vi.fn(() => new Promise<string>(() => {}));
      render(WebTerminal, { props: { execute } });

      await enter("sleep");
      expect(input()).toHaveAttribute("readonly");
      expect(screen.getByTestId("running")).toHaveTextContent("true");
      expect(output()).toHaveAttribute("aria-busy", "true");

      await user.keyboard("more{Enter}");
      expect(execute).toHaveBeenCalledTimes(1);
    });

    it("runs a command from code", async () => {
      const execute = vi.fn(() => "done");
      const { component } = render(WebTerminal, { props: { execute } });

      await component.term?.run("deploy");
      await settle();

      expect(rowTexts()).toEqual(["$ deploy", "done"]);
    });
  });

  describe("cancelling", () => {
    it("aborts the signal on Control + C and releases a handler that never settles", async () => {
      let signal: AbortSignal | undefined;
      render(WebTerminal, {
        props: {
          execute: (_command: string, context: { signal: AbortSignal }) => {
            signal = context.signal;
            return new Promise<string>(() => {});
          },
        },
      });

      await enter("hang");
      await user.keyboard("{Control>}c{/Control}");
      await settle();

      expect(signal?.aborted).toBe(true);
      expect(screen.getByTestId("running")).toHaveTextContent("false");
      expect(rowTexts()).toEqual(["$ hang", "^C"]);
      expect(screen.getByTestId("events")).toHaveTextContent(
        "cancel:hang finish:cancelled",
      );
      await waitFor(() =>
        expect(status()).toHaveTextContent("Command cancelled"),
      );
      expect(input()).not.toHaveAttribute("readonly");
    });

    it("stops a stream, and a stream that never waits cannot block the cancel", async () => {
      let produced = 0;
      function* endless() {
        for (;;) {
          produced++;
          yield "tick\n";
        }
      }
      render(WebTerminal, {
        props: { execute: () => endless(), maxLines: 50 },
      });

      await enter("endless");
      await waitFor(() => expect(produced).toBeGreaterThan(10));
      await user.keyboard("{Control>}c{/Control}");
      await settle();
      const stopped = produced;
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(produced - stopped).toBeLessThanOrEqual(1);
      expect(screen.getByTestId("running")).toHaveTextContent("false");
    });

    it("drops a line being typed, and leaves a selection to copy", async () => {
      render(WebTerminal);

      await user.type(input(), "half a command");
      await user.keyboard("{Control>}c{/Control}");
      await settle();
      expect(input()).toHaveValue("");
      expect(rowTexts()).toEqual(["$ half a command^C"]);

      await user.type(input(), "copy me");
      input().setSelectionRange(0, 4);
      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      input().dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(input()).toHaveValue("copy me");
    });
  });

  describe("history", () => {
    it("walks the commands with Arrow Up and Down and keeps the draft", async () => {
      render(WebTerminal, { props: { execute: () => "" } });
      await enter("first");
      await enter("second");
      expect(screen.getByTestId("history")).toHaveTextContent(
        '["first","second"]',
      );

      await user.type(input(), "draft");
      await user.keyboard("{ArrowUp}");
      expect(input()).toHaveValue("second");
      await user.keyboard("{ArrowUp}");
      expect(input()).toHaveValue("first");
      await user.keyboard("{ArrowUp}");
      expect(input()).toHaveValue("first");
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(input()).toHaveValue("draft");
    });

    it("skips empty commands and repeats of the last", async () => {
      render(WebTerminal, { props: { execute: () => "" } });

      await enter("same");
      await enter("same");
      await user.keyboard("{Enter}");

      expect(screen.getByTestId("history")).toHaveTextContent('["same"]');
    });
  });

  it("clears the output on Control + L", async () => {
    render(WebTerminal, { props: { execute: () => "some output" } });
    await enter("run");
    expect(rowTexts()).toHaveLength(2);

    await user.keyboard("{Control>}l{/Control}");
    await tick();

    expect(rowTexts()).toEqual([]);
    expect(screen.getByTestId("events")).toHaveTextContent("clear");
  });

  describe("completion", () => {
    const commands = ["kubectl", "kubeadm", "ls"];
    const complete = (line: string, cursor: number) => {
      const word = line.slice(0, cursor).split(/\s+/).pop() ?? "";
      return commands.filter((command) => command.startsWith(word));
    };

    it("completes a single candidate and adds a space", async () => {
      render(WebTerminal, { props: { complete } });

      await user.type(input(), "l");
      await user.keyboard("{Tab}");

      await waitFor(() => expect(input()).toHaveValue("ls "));
      expect(input()).toHaveFocus();
    });

    it("extends to the common prefix, then lists what is left", async () => {
      render(WebTerminal, { props: { complete } });

      await user.type(input(), "ku");
      await user.keyboard("{Tab}");
      await waitFor(() => expect(input()).toHaveValue("kube"));

      await user.keyboard("{Tab}");
      await waitFor(() =>
        expect(rowTexts()).toEqual(["$ kube", "kubectl kubeadm"]),
      );
      expect(input()).toHaveValue("kube");
    });

    it("lets an Escape, then Tab, move focus out of the field", async () => {
      render(WebTerminal, { props: { complete } });
      await user.click(input());

      await user.keyboard("{Escape}");
      await user.tab();

      expect(input()).not.toHaveFocus();
    });

    it("keeps Tab for focus when there is no completion function", async () => {
      render(WebTerminal);
      await user.click(input());

      await user.tab();

      expect(input()).not.toHaveFocus();
    });

    it("ignores an answer for a line that has changed", async () => {
      let resolve: (value: string[]) => void = () => {};
      render(WebTerminal, {
        props: {
          complete: () =>
            new Promise<string[]>((r) => {
              resolve = r;
            }),
        },
      });

      await user.type(input(), "k");
      await user.keyboard("{Tab}");
      await user.type(input(), "x");
      resolve(["kubectl"]);
      await settle();

      expect(input()).toHaveValue("kx");
    });
  });

  describe("output", () => {
    it("draws ANSI colors from the themed palette and drops the escapes", async () => {
      const { component } = render(WebTerminal);

      component.term?.write(
        `ok ${ESC}[31mfailed${ESC}[0m ${ESC}[1mdone${ESC}[0m\n`,
      );
      await settle();

      expect(rowTexts()).toEqual(["ok failed done"]);
      expect(screen.getByText("failed")).toHaveStyle({
        color: "var(--ccs-term-ansi-1)",
      });
      expect(screen.getByText("done")).toHaveStyle({ fontWeight: "600" });
    });

    it("overwrites a row for a carriage return, as a progress bar does", async () => {
      const { component } = render(WebTerminal);

      component.term?.write("10%\r50%\r100%\n");
      component.term?.write("next\n");
      await settle();

      expect(rowTexts()).toEqual(["100%", "next"]);
    });

    it("treats output as text: no markup, no links, no scripts", async () => {
      const { component } = render(WebTerminal);

      component.term?.write(
        `<img src=x onerror=alert(1)> ${ESC}]8;;javascript:alert(1)${ESC}\\click${ESC}]8;;${ESC}\\\n`,
      );
      await settle();

      expect(document.querySelector("img")).toBeNull();
      expect(document.querySelector("a")).toBeNull();
      expect(rowTexts()).toEqual(["<img src=x onerror=alert(1)> click"]);
    });

    it("draws a window of a long scrollback, and drops rows past maxLines", async () => {
      const { component } = render(WebTerminal, { props: { maxLines: 5000 } });

      component.term?.write(
        Array.from({ length: 8000 }, (_, i) => `line ${i}`).join("\n") + "\n",
      );
      await settle();

      const drawn = rowTexts();
      expect(drawn.length).toBeGreaterThan(0);
      expect(drawn.length).toBeLessThan(200);
      const kept = component.term?.getText().split("\n") ?? [];
      expect(kept).toHaveLength(5000);
      expect(kept.at(-1)).toBe("line 7999");
    });

    it("batches writes into one update a frame", async () => {
      const { component } = render(WebTerminal);

      component.term?.write("a\n");
      component.term?.write("b\n");
      expect(rowTexts()).toEqual([]);
      await settle();

      expect(rowTexts()).toEqual(["a", "b"]);
    });
  });

  describe("following", () => {
    function scrollAway(top: number) {
      const region = output();
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
      const { component } = render(WebTerminal);
      component.term?.write("a\n".repeat(500));
      await settle();
      await scrollAway(9600);
      await scrollAway(5000);
      await tick();

      expect(component.follow).toBe(false);
      component.term?.write("more\n");
      await settle();
      await user.click(
        screen.getByRole("button", { name: "Jump to latest (1 new)" }),
      );

      expect(component.follow).toBe(true);
    });

    it("follows again when a command is run", async () => {
      const { component } = render(WebTerminal, {
        props: { execute: () => "" },
      });
      component.term?.write("a\n".repeat(500));
      await settle();
      await scrollAway(9600);
      await scrollAway(5000);
      await tick();
      expect(component.follow).toBe(false);

      await enter("go");

      expect(component.follow).toBe(true);
    });
  });

  describe("copying", () => {
    it("copies the whole scrollback as plain text", async () => {
      const { component } = render(WebTerminal);
      component.term?.write(`${ESC}[32mgreen${ESC}[0m\nplain\n`);
      await settle();

      await user.click(screen.getByRole("button", { name: "Copy output" }));

      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith("green\nplain"),
      );
    });

    it("copies a command from its row", async () => {
      render(WebTerminal, { props: { execute: () => "" } });
      await enter("kubectl get pods");

      const button = document.querySelector(
        ".bx--web-terminal__copy-command",
      ) as HTMLButtonElement;
      expect(button).toHaveAttribute("aria-hidden", "true");
      expect(button).toHaveAttribute("tabindex", "-1");
      await user.click(button);

      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith("kubectl get pods"),
      );
    });

    it("selects all rows with Control + A on the output and copies them", async () => {
      const { component } = render(WebTerminal);
      component.term?.write("one\ntwo\n");
      await settle();

      output().focus();
      await user.keyboard("{Control>}a{/Control}");
      expect(screen.getByTestId("terminal")).toHaveClass(
        "bx--web-terminal--selected",
      );
      await user.keyboard("{Control>}c{/Control}");

      await waitFor(() => expect(writeText).toHaveBeenCalledWith("one\ntwo"));
    });
  });

  it("sends typing in the output to the command line", async () => {
    render(WebTerminal);
    output().focus();

    await user.keyboard("l");

    expect(input()).toHaveFocus();
  });

  it("reports maximize and restore through a binding", async () => {
    render(WebTerminal, { props: { maximizable: true } });

    await user.click(screen.getByRole("button", { name: "Maximize" }));
    expect(screen.getByTestId("maximized")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByTestId("maximized")).toHaveTextContent("false");
  });
});
