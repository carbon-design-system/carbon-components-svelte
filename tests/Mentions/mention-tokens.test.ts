// @vitest-environment node
import {
  buildInsertion,
  formatMentionToken,
  mentionsToPlainText,
  parseMentionTokens,
  reconcileMentions,
  spliceFromValues,
} from "../../src/Mentions/mention-tokens.js";

const alice = { id: "u1", text: "Alice Smith" };

describe("tokens", () => {
  it("round-trips a name that holds the syntax's own characters", () => {
    const text = "Re]gina (\\o) [x]";
    const id = "a)b\\c";
    const value = `hi ${formatMentionToken("@", text, id)}!`;
    expect(parseMentionTokens(value, ["@"])).toEqual([
      { trigger: "@", text, id, start: 3, end: value.length - 1 },
    ]);
  });

  it("reads each listed trigger and no other", () => {
    const value = "@[A](1) #[B](2) ![img](x.png) :[C](3)";
    expect(parseMentionTokens(value, ["@", "#"]).map((m) => m.text)).toEqual([
      "A",
      "B",
    ]);
  });

  it("turns tokens back into the text a reader sees", () => {
    expect(
      mentionsToPlainText("hi @[Alice](u1), see #[T-9](9)", ["@", "#"]),
    ).toBe("hi @Alice, see #T-9");
  });

  it("stays linear on hostile input", () => {
    const value = `@[${"\\".repeat(50_000)}`;
    const start = performance.now();
    parseMentionTokens(value, ["@"]);
    expect(performance.now() - start).toBeLessThan(100);
  });
});

describe("spliceFromValues", () => {
  it("finds an insertion, a deletion and a replacement", () => {
    expect(spliceFromValues("ab", "aXb")).toEqual({
      start: 1,
      removed: 0,
      inserted: 1,
    });
    expect(spliceFromValues("aXb", "ab")).toEqual({
      start: 1,
      removed: 1,
      inserted: 0,
    });
    expect(spliceFromValues("abc", "aZc")).toEqual({
      start: 1,
      removed: 1,
      inserted: 1,
    });
  });

  it("uses the caret to place an edit among repeated characters", () => {
    // Backspace after the second "a": the first match would say index 1.
    expect(spliceFromValues("aaa", "aa", 2)).toEqual({
      start: 2,
      removed: 1,
      inserted: 0,
    });
    expect(spliceFromValues("aaa", "aa")).toEqual({
      start: 2,
      removed: 1,
      inserted: 0,
    });
    expect(spliceFromValues("a@a", "a@", 2)).toEqual({
      start: 2,
      removed: 1,
      inserted: 0,
    });
  });
});

describe("reconcileMentions", () => {
  const m = (start: number, end: number) => ({
    trigger: "@",
    id: "u",
    text: "x",
    start,
    end,
  });

  it("leaves a mention before the edit and moves one after it", () => {
    const list = [m(0, 6), m(10, 16)];
    expect(
      reconcileMentions(list, { start: 8, removed: 0, inserted: 3 }),
    ).toEqual([m(0, 6), m(13, 19)]);
  });

  it("keeps a mention when text is typed right before or after it", () => {
    const list = [m(5, 11)];
    expect(
      reconcileMentions(list, { start: 11, removed: 0, inserted: 1 }),
    ).toEqual(list);
    expect(
      reconcileMentions(list, { start: 5, removed: 0, inserted: 2 }),
    ).toEqual([m(7, 13)]);
  });

  it("drops a mention the edit touches", () => {
    const list = [m(5, 11)];
    expect(
      reconcileMentions(list, { start: 8, removed: 0, inserted: 1 }),
    ).toEqual([]);
    expect(
      reconcileMentions(list, { start: 10, removed: 1, inserted: 0 }),
    ).toEqual([]);
    expect(
      reconcileMentions(list, { start: 3, removed: 4, inserted: 0 }),
    ).toEqual([]);
  });
});

describe("buildInsertion", () => {
  it('writes the trigger, the text and a space for "text"', () => {
    expect(
      buildInsertion({ char: "@", format: "text", item: alice, start: 3 }),
    ).toEqual({
      insert: "@Alice Smith ",
      mention: {
        trigger: "@",
        id: "u1",
        text: "Alice Smith",
        start: 3,
        end: 15,
      },
      caret: 16,
    });
  });

  it("writes insertText instead of the text", () => {
    const { insert } = buildInsertion({
      char: "@",
      format: "text",
      item: { ...alice, insertText: "alice" },
      start: 0,
    });
    expect(insert).toBe("@alice ");
  });

  it("writes a token that carries the id", () => {
    const result = buildInsertion({
      char: "@",
      format: "token",
      item: alice,
      start: 0,
    });
    expect(result.insert).toBe("@[Alice Smith](u1) ");
    expect(parseMentionTokens(result.insert, ["@"])[0]).toMatchObject({
      id: "u1",
      text: "Alice Smith",
    });
  });

  it('replaces the trigger and records nothing for "plain"', () => {
    expect(
      buildInsertion({
        char: ":",
        format: "plain",
        item: { id: "s", text: "smile", insertText: "\u{1F604}" },
        start: 0,
        suffix: "",
      }),
    ).toEqual({ insert: "\u{1F604}", mention: null, caret: 2 });
  });

  it("adds no space when whitespace already follows", () => {
    const result = buildInsertion({
      char: "@",
      format: "text",
      item: alice,
      start: 0,
      following: " and more",
    });
    expect(result.insert).toBe("@Alice Smith");
  });
});
