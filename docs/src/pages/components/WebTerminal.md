---
components: ["WebTerminal"]
description: A web terminal is a command console: a scrollback of colored output above a prompt, with history, completion and streaming output from commands your app runs.
keywords: ["console", "shell", "cli", "repl", "command line"]
---

<script>
  import { onMount } from "svelte";
  import { Button, Stack, WebTerminal } from "carbon-components-svelte";

  const ESC = "\u001b";

  function execute(command) {
    if (command === "date") return new Date().toDateString();
    return `You ran ${command}`;
  }

  async function* countdown(command, { signal }) {
    for (let n = 5; n > 0; n--) {
      if (signal.aborted) return;
      yield `T-${n}\n`;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    yield "Liftoff\n";
  }

  let colors;

  onMount(() => {
    const names = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
    const row = (base) =>
      names.map((name, i) => `${ESC}[${base + i}m${name}${ESC}[0m`).join(" ");
    colors.writeln(row(30));
    colors.writeln(row(90));
    colors.writeln(names.map((name, i) => `${ESC}[4${i};${i === 0 || i === 7 ? 9 : 3}${i === 0 ? 7 : 0}m ${name} ${ESC}[0m`).join(""));
    colors.writeln(`${ESC}[1mbold${ESC}[0m ${ESC}[2mdim${ESC}[0m ${ESC}[3mitalic${ESC}[0m ${ESC}[4munderline${ESC}[0m ${ESC}[9mstrike${ESC}[0m ${ESC}[7minverse${ESC}[0m`);
    colors.writeln(`${ESC}[38;5;208m256-color orange${ESC}[0m ${ESC}[38;2;30;110;255mtruecolor blue${ESC}[0m`);
  });

  let progress;

  async function download() {
    for (let step = 0; step <= 20; step++) {
      progress.write(`\r${ESC}[2KDownloading [${"#".repeat(step)}${".".repeat(20 - step)}] ${step * 5}%`);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    progress.writeln("");
  }

  const commands = ["date", "deploy", "describe", "logs"];

  function complete(line, cursor) {
    const word = line.slice(0, cursor).split(/\s+/).at(-1);
    return commands.filter((command) => command.startsWith(word));
  }

  let history = ["deploy api", "logs api"];
</script>

## Basic

A terminal shows what commands print and takes the next command from a prompt. Pass `execute`: it receives the command the user typed and returns its output, which the terminal writes under the command. Output is text; see [Output](#output) for the colors it understands.

Give the terminal a `height`, or `"100%"` inside a container that has one. The output keeps the newest row in view; scroll up to read, and "Jump to latest" brings you back.

<WebTerminal {execute} height="14rem" title="Terminal" />

## Output

Everything the terminal shows is text: a row is never parsed as HTML, and escape sequences never become links. Write to it from your app with `write` and `writeln`, or return output from `execute`.

### Colors and text styles

Output can use ANSI SGR sequences, the colors and styles that command line tools print. The 16 colors, the bright colors, 256-color and truecolor are drawn from Carbon's palette on the terminal's background, and 256-color and truecolor text is moved toward black or white until it meets `minContrast`. A style set on one row carries to the next until a reset, as it does in a terminal.

<WebTerminal bind:this={colors} height="11rem" title="Colors" />

| Sequence | Meaning |
| --- | --- |
| `ESC[0m` | Reset every style |
| `ESC[1m`, `ESC[2m`, `ESC[3m`, `ESC[4m`, `ESC[9m`, `ESC[7m` | Bold, dim, italic, underline, strikethrough, reverse video |
| `ESC[30m` to `ESC[37m`, `ESC[90m` to `ESC[97m` | The 16 foreground colors |
| `ESC[40m` to `ESC[47m`, `ESC[100m` to `ESC[107m` | The 16 background colors |
| `ESC[38;5;Nm`, `ESC[48;5;Nm` | A color from the 256-color palette |
| `ESC[38;2;R;G;Bm`, `ESC[48;2;R;G;Bm` | A truecolor |
| `ESC[K`, `ESC[1K`, `ESC[2K` | Erase to the end of the row, to the start, the whole row |

Text that is not on this list is read and dropped. Cursor movement, the alternate screen, scrolling regions, window titles and OSC 8 hyperlinks have no effect, and the text of a hyperlink shows as plain text. A control character in the output is removed, and so are the characters that reorder text, such as the right-to-left override.

### Progress and overwrite

A carriage return starts the next text at the beginning of the row, so a progress bar redraws in place. Pair it with `ESC[2K` to clear the row first.

<Stack gap={5}>
  <WebTerminal bind:this={progress} height="6rem" title="Download" />
  <Button size="small" kind="tertiary" on:click={download}>Start download</Button>
</Stack>

### Streaming

Return an array, a generator or an async generator from `execute` and each chunk is written as it arrives. Chunks are raw output, so end a line with a newline. Output that arrives faster than a frame is drawn once a frame.

The second argument is a context with a `signal`. It aborts when the user presses <DocKbd label="Ctrl" /> + <DocKbd label="C" />, so a handler that fetches or waits can stop. A handler that ignores the signal is still released: the terminal stops writing its output and the prompt comes back.

<WebTerminal execute={countdown} height="10rem" title="Streaming" />

Return a `ReadableStream` body from `fetch` by reading it into an async generator of `Uint8Array` chunks; the terminal decodes the bytes, including a character split across two chunks.

### Scrollback

The terminal keeps `maxLines` rows (100,000 by default) and draws only the rows in view, so a long log costs no more than a short one. When more arrive, the oldest are dropped, and a reader scrolled up keeps their place. A row longer than `maxLineLength` characters is cut and ends in an ellipsis. Set `wrap` to wrap long rows instead of scrolling sideways.

## Prompt

The prompt is a text input labelled "Command". Set `prompt` to change the text before it, such as a user and host.

### History

<DocKbd label="↑" /> and <DocKbd label="↓" /> walk the commands that were run, and bring back the line being typed when they reach the end. `history` lists them, oldest first; bind it to keep it in storage. A repeat of the last command and an empty line are not added.

<WebTerminal {execute} bind:history height="10rem" title="History" />

### Tab completion

Set `complete` to a function that receives the line and the cursor position and returns the candidates for the word at the cursor. One candidate completes the word. Several complete to what they share, and when they share nothing more, the terminal lists them in the output. The function may be async; its answer is dropped if the line changed meanwhile.

Return an object with `candidates` and the `from` and `to` of the text they replace for completion that does not follow word boundaries, such as a path.

<WebTerminal {execute} {complete} height="10rem" title="Completion" />

With `complete` set, <DocKbd label="Tab" /> completes instead of moving focus. To keep keyboard focus from being trapped, press <DocKbd label="Esc" /> and then <DocKbd label="Tab" /> to leave the prompt; <DocKbd label="Shift" /> + <DocKbd label="Tab" /> always moves focus back. Without `complete`, <DocKbd label="Tab" /> behaves as usual.

### Keyboard

| Key | Action |
| --- | --- |
| <DocKbd label="Enter" /> | Run the command |
| <DocKbd label="↑" />, <DocKbd label="↓" /> | Previous and next command in the history |
| <DocKbd label="Ctrl" /> + <DocKbd label="C" /> | Cancel the running command, or drop the line being typed. With text selected, it copies |
| <DocKbd label="Ctrl" /> + <DocKbd label="L" /> | Clear the output |
| <DocKbd label="Tab" /> | Complete the word, when `complete` is set |
| <DocKbd label="Esc" />, then <DocKbd label="Tab" /> | Leave the prompt |
| <DocKbd label="Page Up" />, <DocKbd label="Page Down" /> | Scroll the output without leaving the prompt |
| <DocKbd label="Ctrl" /> + <DocKbd label="Home" />, <DocKbd label="Ctrl" /> + <DocKbd label="End" /> | Go to the first row, or to the newest and follow it |
| <DocKbd label="Ctrl" /> + <DocKbd label="A" /> in the output | Select every row; <DocKbd label="Ctrl" /> + <DocKbd label="C" /> copies them |

While a command runs the prompt is read-only but keeps focus, so <DocKbd label="Ctrl" /> + <DocKbd label="C" /> works at once. Typing in the output moves focus to the prompt.

### Copying

The header's "Copy output" button copies the whole scrollback as plain text, which a virtualized selection cannot do. A command in the output shows a copy button when it is hovered, for pointer users; keyboard users recall a command with <DocKbd label="↑" /> and copy it from the prompt.

## Layout

### Docked

The terminal fills the height of its container, so a pane of a `Splitter` makes a docked panel with a resizable edge. Set `maximizable` to show a button that toggles `maximized`. The terminal only reports it; the host decides what it means. Here it collapses the other pane.

<FileSource src="/framed/WebTerminal/WebTerminalDocked" />

### Theme

A terminal is dark whichever theme the page uses, so it defaults to `theme="g100"`. Set `theme` to any Carbon theme, or to `"system"` to follow the operating system. A light theme uses a light palette for the 16 colors. The terminal stays left to right on a right-to-left page; only its header follows the page.

<Stack gap={5}>
  <WebTerminal {execute} theme="white" height="8rem" title="White" />
  <WebTerminal {execute} theme="g90" height="8rem" title="Gray 90" />
</Stack>

## Accessibility

The output is a `log` that is not itself live (`aria-live="off"`): a window that scrolls would otherwise read every row that comes into view. A separate status announces when a command ends, so output is never read as it streams.

| What happens | What is announced |
| --- | --- |
| A command ends with 5 lines or fewer | The lines themselves, such as "42" |
| A command ends with more lines | "Command finished, 240 lines" |
| A command fails | "Command failed", with the count |
| Control + C cancels | "Command cancelled" |
| Completion lists candidates | The count, such as "3 completions" |
| Output is copied | "Copied" |

Set `announceLines` to change how many lines are read in full, and `finishedText`, `completionsText` and the other text props to translate. Forced colors drop the palette and keep bold and underline, as the system asks for. The command line has its keys as its description.

## Examples

### Command line

A fake `kubectl` with streaming logs, a progress bar, history and completion. Try `kubectl logs api-7d9f8c6b5-x2k4p -f`, then <DocKbd label="Ctrl" /> + <DocKbd label="C" />.

<FileSource src="/framed/WebTerminal/WebTerminalKubectl" />

### Read-eval-print loop

A calculator that reads each line as tokens and looks every one up in a table. It never calls `eval` or `Function`.

<FileSource src="/framed/WebTerminal/WebTerminalCalculator" />

## Security

| Do | Why |
| --- | --- |
| Run commands on your server, behind your own permission check. | The terminal sends the line to `execute` and nothing else; it neither runs nor sanitizes a command. |
| Never pass the line to `eval`, `Function` or a shell on the page. | Whoever can type in the terminal could run code with the page's permissions. |
| Treat what `execute` returns as untrusted text from the program that produced it. | The terminal removes control characters, bidi overrides and every sequence it does not draw, and builds rows with text nodes. |
| Keep secrets out of the scrollback and the history. | Both are readable by anyone at the screen, and `history` is yours to store. |
| Say which code runs without limits, such as your `execute` and `complete`. | The terminal bounds its own parsing; it cannot bound a function you pass in. |
