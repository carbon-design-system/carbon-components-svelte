// @vitest-environment node
import {
  fakeChatStream,
  sseStream,
  textStream,
} from "../../src/Chat/chat-adapters.js";

async function collect<T>(source: AsyncIterable<T>) {
  const out: T[] = [];
  for await (const chunk of source) out.push(chunk);
  return out;
}

const bytes = (...parts: Array<string | Uint8Array>) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const part of parts) {
          controller.enqueue(
            typeof part === "string" ? new TextEncoder().encode(part) : part,
          );
        }
        controller.close();
      },
    }),
  );

describe("fakeChatStream", () => {
  it("yields the words a few at a time, then the sources", async () => {
    const chunks = await collect(
      fakeChatStream("one two three four five", {
        wordsPerChunk: 2,
        intervalMs: 0,
        status: "Searching",
        sources: [{ title: "Runbook" }],
      }),
    );

    expect(chunks).toEqual([
      { type: "status", text: "Searching" },
      "one two ",
      "three four ",
      "five",
      { type: "source", title: "Runbook" },
    ]);
  });

  it("stops with an AbortError when the signal aborts, even while waiting", async () => {
    const controller = new AbortController();
    const stream = fakeChatStream("one two three", {
      wordsPerChunk: 1,
      intervalMs: 10_000,
      signal: controller.signal,
    });

    expect(await stream.next()).toMatchObject({ value: "one " });
    const next = stream.next();
    controller.abort();

    await expect(next).rejects.toMatchObject({ name: "AbortError" });
  });

  it("fails after a number of chunks, to try an error", async () => {
    await expect(
      collect(
        fakeChatStream("a b c d", {
          wordsPerChunk: 1,
          intervalMs: 0,
          failAfter: 2,
        }),
      ),
    ).rejects.toThrow("The connection was lost");
  });
});

describe("textStream", () => {
  it("decodes text, holding a character split between chunks", async () => {
    const euro = new TextEncoder().encode("€");
    const chunks = await collect(
      textStream(bytes("Price: ", euro.slice(0, 1), euro.slice(1), " 5")),
    );

    expect(chunks.join("")).toBe("Price: € 5");
    expect(chunks.every((chunk) => !chunk.includes("�"))).toBe(true);
  });

  it("throws for a failed request", async () => {
    await expect(
      collect(textStream(new Response("nope", { status: 503 }))),
    ).rejects.toThrow("503");
  });
});

describe("sseStream", () => {
  it("yields the data of each event, across chunk boundaries and line endings", async () => {
    const chunks = await collect(
      sseStream(
        bytes(
          "data: Hel",
          "lo\n\ndata: two\ndata: lines\n\n",
          ": a comment\r\n\r\nevent: x\r\ndata: crlf\r\n\r\n",
        ),
      ),
    );

    expect(chunks).toEqual(["Hello", "two\nlines", "crlf"]);
  });

  it("stops at [DONE] and can parse JSON, skipping what it returns undefined for", async () => {
    const chunks = await collect(
      sseStream(
        bytes(
          'data: {"delta":"a"}\n\ndata: {"ping":true}\n\ndata: {"delta":"b"}\n\ndata: [DONE]\n\ndata: {"delta":"never"}\n\n',
        ),
        { parse: (data) => JSON.parse(data).delta },
      ),
    );

    expect(chunks).toEqual(["a", "b"]);
  });
});
