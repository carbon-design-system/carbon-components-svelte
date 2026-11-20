// @vitest-environment node
import {
  ABORTED,
  pipeOutput,
  raceAbort,
} from "../../src/utils/terminal-run.js";

function collect() {
  const chunks: string[] = [];
  return { chunks, write: (text: string) => chunks.push(text) };
}

describe("raceAbort", () => {
  it("resolves with the promise, or with ABORTED when the signal fires first", async () => {
    const controller = new AbortController();
    await expect(
      raceAbort(Promise.resolve(1), controller.signal),
    ).resolves.toBe(1);

    const pending = raceAbort(new Promise(() => {}), controller.signal);
    controller.abort();
    await expect(pending).resolves.toBe(ABORTED);
    await expect(
      raceAbort(Promise.resolve(2), controller.signal),
    ).resolves.toBe(ABORTED);
  });

  it("rejects with the promise's error", async () => {
    await expect(
      raceAbort(Promise.reject(new Error("no")), new AbortController().signal),
    ).rejects.toThrow("no");
  });
});

describe("pipeOutput", () => {
  const signal = () => new AbortController().signal;

  it("writes a string, an array, a generator and an async generator", async () => {
    async function* later() {
      yield "x";
      yield "y";
    }
    function* now() {
      yield "m";
      yield "n";
    }
    for (const [input, expected] of [
      ["text", ["text"]],
      [
        ["a", "b"],
        ["a", "b"],
      ],
      [now(), ["m", "n"]],
      [later(), ["x", "y"]],
    ] as const) {
      const out = collect();
      // eslint-disable-next-line no-await-in-loop -- one case at a time
      await pipeOutput(input, { signal: signal(), write: out.write });
      expect(out.chunks).toEqual(expected);
    }
  });

  it("writes nothing for nothing", async () => {
    const out = collect();
    await pipeOutput(undefined, { signal: signal(), write: out.write });
    await pipeOutput(null, { signal: signal(), write: out.write });
    expect(out.chunks).toEqual([]);
  });

  it("decodes bytes split in the middle of a character", async () => {
    const bytes = new TextEncoder().encode("é✓");
    const out = collect();
    await pipeOutput([bytes.slice(0, 1), bytes.slice(1, 3), bytes.slice(3)], {
      signal: signal(),
      write: out.write,
    });
    expect(out.chunks.join("")).toBe("é✓");
  });

  it("stops at an abort and closes the generator", async () => {
    const controller = new AbortController();
    let closed = false;
    async function* endless() {
      try {
        for (let i = 0; ; i++) yield `${i}\n`;
      } finally {
        closed = true;
      }
    }
    const out = collect();
    const done = pipeOutput(endless(), {
      signal: controller.signal,
      write: (text) => {
        out.write(text);
        if (out.chunks.length === 3) controller.abort();
      },
    });
    await done;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(out.chunks).toEqual(["0\n", "1\n", "2\n"]);
    expect(closed).toBe(true);
  });

  it("gives the page a turn during a stream that never waits", async () => {
    let turns = 0;
    const interval = setInterval(() => turns++, 1);
    function* busy() {
      const end = performance.now() + 60;
      while (performance.now() < end) yield "x";
    }
    await pipeOutput(busy(), { signal: signal(), write: () => {}, sliceMs: 5 });
    clearInterval(interval);
    expect(turns).toBeGreaterThan(2);
  });
});
