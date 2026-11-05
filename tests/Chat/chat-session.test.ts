// @vitest-environment node
import { get } from "svelte/store";
import type { ChatChunk } from "../../src/Chat/chat-adapters.js";
import {
  type ChatRequest,
  createChatSession,
} from "../../src/Chat/chat-session.js";

/** A reply that yields only what the test pushes, when it pushes it. */
function controlled() {
  const queue: Array<ChatChunk | Error | null> = [];
  let wake: (() => void) | undefined;
  const push = (chunk: ChatChunk | Error | null) => {
    queue.push(chunk);
    wake?.();
  };
  async function* iterate() {
    for (;;) {
      while (queue.length === 0) {
        // biome-ignore lint/performance/noAwaitInLoops: waits for the test's next push
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      const next = queue.shift();
      if (next === null) return;
      if (next instanceof Error) throw next;
      yield next as ChatChunk;
    }
  }
  return { iterate: iterate(), push };
}

/** A reply of fixed chunks. */
const replyOf = (...chunks: ChatChunk[]): AsyncIterable<ChatChunk> => ({
  [Symbol.asyncIterator]: () => {
    let index = 0;
    return {
      next: () =>
        Promise.resolve(
          index < chunks.length
            ? { done: false as const, value: chunks[index++] }
            : { done: true as const, value: undefined },
        ),
    };
  },
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const last = (session: ReturnType<typeof createChatSession>) => {
  const { messages } = get(session);
  return messages[messages.length - 1];
};

describe("createChatSession", () => {
  it("adds the prompt, waits, streams the reply and ends done", async () => {
    const reply = controlled();
    const session = createChatSession({
      onSend: () => reply.iterate,
      update: "sync",
    });

    session.send({ text: "Why is billing slow?" });
    expect(get(session).status).toBe("submitted");
    expect(get(session).messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "Why is billing slow?"],
      ["assistant", ""],
    ]);

    reply.push("It reads ");
    await settle();
    expect(get(session).status).toBe("streaming");
    reply.push("one row at a time.");
    reply.push(null);
    await settle();

    expect(last(session)).toMatchObject({
      role: "assistant",
      content: "It reads one row at a time.",
      state: "done",
    });
    expect(get(session).status).toBe("ready");
  });

  it("gives onSend the prompt, its attachments, a signal and the conversation", async () => {
    const onSend = vi.fn((_request: ChatRequest) => replyOf("ok"));
    const session = createChatSession({
      onSend,
      update: "sync",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });
    const file = { name: "a.png" };

    session.send({ text: "look", attachments: [file] });
    await settle();

    const request = onSend.mock.calls[0][0];
    expect(request.text).toBe("look");
    expect(request.attachments).toEqual([file]);
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(request.messages.map((m) => m.content)).toEqual([
      "hi",
      "hello",
      "look",
    ]);
  });

  it("refuses a message while a reply is arriving", () => {
    const reply = controlled();
    const session = createChatSession({ onSend: () => reply.iterate });

    expect(session.send({ text: "one" })).toBe(true);
    expect(session.send({ text: "two" })).toBe(false);
    expect(get(session).messages).toHaveLength(2);
  });

  it("joins the chunks of a frame into one update", async () => {
    const frames: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) =>
      frames.push(callback),
    );
    const reply = controlled();
    const session = createChatSession({ onSend: () => reply.iterate });
    let updates = 0;
    session.subscribe(() => updates++);
    session.send({ text: "go" });
    updates = 0;

    for (const word of ["a ", "b ", "c ", "d "]) reply.push(word);
    await settle();
    expect(last(session).content).toBe("");
    expect(frames).toHaveLength(1);

    frames[0]();
    expect(last(session).content).toBe("a b c d ");
    expect(updates).toBeLessThanOrEqual(3);
    reply.push(null);
    vi.unstubAllGlobals();
  });

  it("stops: keeps what arrived, aborts the signal and ignores the rest", async () => {
    const reply = controlled();
    let signal: AbortSignal | undefined;
    const session = createChatSession({
      onSend: (request) => {
        signal = request.signal;
        return reply.iterate;
      },
      update: "sync",
    });
    session.send({ text: "go" });
    reply.push("Two ser");
    await settle();

    session.stop();
    reply.push("vices failed.");
    await settle();

    expect(signal?.aborted).toBe(true);
    expect(last(session)).toMatchObject({
      content: "Two ser",
      state: "stopped",
    });
    expect(get(session).status).toBe("ready");
  });

  it("shows an error, keeps the partial reply, and can be tried again", async () => {
    const reply = controlled();
    const onSend = vi
      .fn()
      .mockImplementationOnce(() => reply.iterate)
      .mockImplementation(() => replyOf("Second time."));
    const session = createChatSession({ onSend, update: "sync" });
    session.send({ text: "go" });
    reply.push("Half a ");
    reply.push(new Error("The connection was lost"));
    await settle();

    expect(get(session).status).toBe("error");
    expect(last(session)).toMatchObject({ content: "Half a ", state: "error" });
    expect((last(session).error as Error).message).toBe(
      "The connection was lost",
    );

    session.regenerate();
    await settle();

    expect(
      get(session).messages.map((m) => [m.role, m.content, m.state]),
    ).toEqual([
      ["user", "go", "done"],
      ["assistant", "Second time.", "done"],
    ]);
    expect(get(session).status).toBe("ready");
  });

  it("regenerates the last reply for the same prompt, stopping one in flight", async () => {
    const replies = ["first", "second"].map(() => controlled());
    const onSend = vi.fn().mockImplementation(() => replies.shift()?.iterate);
    const session = createChatSession({ onSend, update: "sync" });
    session.send({ text: "go" });
    await settle();

    session.regenerate();
    await settle();

    expect(onSend).toHaveBeenCalledTimes(2);
    expect(onSend.mock.calls[1][0].text).toBe("go");
    expect(get(session).messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
    ]);
  });

  it("edits a prompt, drops what came after it and replies to the new text", async () => {
    const onSend = vi.fn(({ text }: { text: string }) =>
      replyOf(`re: ${text}`),
    );
    const session = createChatSession({ onSend, update: "sync" });
    session.send({ text: "first" });
    await settle();
    session.send({ text: "second" });
    await settle();
    const first = get(session).messages[0];

    expect(session.edit(first.id, "first, reworded")).toBe(true);
    await settle();

    expect(get(session).messages.map((m) => m.content)).toEqual([
      "first, reworded",
      "re: first, reworded",
    ]);
    expect(session.edit("nope", "x")).toBe(false);
  });

  it("keeps sources and the status line, and leaves out a type it doesn't know", async () => {
    const reply = controlled();
    const session = createChatSession({
      onSend: () => reply.iterate,
      update: "sync",
    });
    session.send({ text: "go" });

    reply.push({ type: "status", text: "Searching the docs" });
    await settle();
    expect(last(session).statusText).toBe("Searching the docs");

    reply.push({ type: "text", text: "Answer." });
    reply.push({
      type: "source",
      title: "Runbook",
      url: "https://example.com/r",
    });
    reply.push({ type: "tool-call", name: "x" } as unknown as ChatChunk);
    reply.push(null);
    await settle();

    expect(last(session)).toMatchObject({
      content: "Answer.",
      sources: [{ title: "Runbook", url: "https://example.com/r" }],
      statusText: "",
    });
  });

  it("reads a ReadableStream, which isn't async iterable in every browser", async () => {
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue("a ");
        controller.enqueue("b");
        controller.close();
      },
    });
    const session = createChatSession({ onSend: () => stream, update: "sync" });

    session.send({ text: "go" });
    await settle();

    expect(last(session).content).toBe("a b");
  });

  it("starts over with reset, and ignores a reply still arriving", async () => {
    const reply = controlled();
    const session = createChatSession({
      onSend: () => reply.iterate,
      update: "sync",
    });
    session.send({ text: "go" });

    session.reset();
    reply.push("late");
    await settle();

    expect(get(session)).toEqual({ messages: [], status: "ready" });
  });
});
