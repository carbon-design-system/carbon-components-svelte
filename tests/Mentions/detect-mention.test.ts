// @vitest-environment node
import {
  detectMention,
  type MentionRule,
} from "../../src/Mentions/detect-mention.js";

const at: MentionRule = { char: "@" };
const hash: MentionRule = { char: "#" };
const emoji: MentionRule = { char: ":", minQueryLength: 2 };
const command: MentionRule = { char: "/", position: "line-start" };

function at_(text: string, rules: MentionRule[] = [at]) {
  // `|` marks the caret.
  const caret = text.indexOf("|");
  const value = text.slice(0, caret) + text.slice(caret + 1);
  return detectMention(value, caret, rules);
}

describe("detectMention", () => {
  it("reads the query between the trigger and the caret", () => {
    expect(at_("hi @ali|")).toEqual({
      index: 0,
      char: "@",
      query: "ali",
      start: 3,
      end: 7,
    });
  });

  it("matches the bare trigger with an empty query", () => {
    expect(at_("hi @|")?.query).toBe("");
  });

  it("is not a trigger in the middle of a word", () => {
    expect(at_("write to a@b.com|")).toBeNull();
    expect(at_("a@|")).toBeNull();
    expect(at_("x.y@z|")).toBeNull();
    expect(at_("@@|")).toBeNull();
  });

  it("allows the start of the text, whitespace and opening brackets", () => {
    expect(at_("@a|")?.start).toBe(0);
    expect(at_("a\n@a|")?.start).toBe(2);
    expect(at_("(@a|")?.start).toBe(1);
    expect(at_('"@a|')?.start).toBe(1);
  });

  it("allows a trigger straight after text in a script without spaces", () => {
    expect(at_("你好@小|")?.query).toBe("小");
  });

  it("ends the query at whitespace or punctuation", () => {
    expect(at_("@ali |")).toBeNull();
    expect(at_("@ali, |")).toBeNull();
    expect(at_("@ali)|")).toBeNull();
    expect(at_("@ali:|")).toBeNull();
    expect(at_("@ali\nb|")).toBeNull();
  });

  it("keeps a dot, dash or apostrophe inside the query", () => {
    expect(at_("@jo.doe-x|")?.query).toBe("jo.doe-x");
    expect(at_("@o'brien|")?.query).toBe("o'brien");
  });

  it("looks only at the text before the caret", () => {
    const match = at_("@al|ice bob");
    expect(match?.query).toBe("al");
  });

  it("closes while text is selected or the caret is out of range", () => {
    expect(detectMention("@ali", 0, [at])).toBeNull();
    expect(detectMention("@ali", 9, [at])).toBeNull();
    expect(detectMention("@ali", -1, [at])).toBeNull();
  });

  it("picks the trigger nearest the caret among several", () => {
    const both = [at, hash];
    expect(at_("@ali #12|", both)).toMatchObject({ char: "#", query: "12" });
    expect(at_("#12 @al|", both)).toMatchObject({ char: "@", query: "al" });
  });

  it("does not take a trigger inside another trigger's word", () => {
    expect(at_("@ali#12|", [at, hash])).toMatchObject({
      char: "@",
      query: "ali#12",
    });
  });

  it("holds a trigger back until the query is long enough", () => {
    expect(at_("hi :s|", [emoji])).toBeNull();
    expect(at_("hi :sm|", [emoji])?.query).toBe("sm");
    expect(at_("at 10:30|", [emoji])).toBeNull();
    expect(at_("re: ok|", [emoji])).toBeNull();
  });

  it("closes after the closing colon of an emoji", () => {
    expect(at_("hi :smile:|", [emoji])).toBeNull();
  });

  it("limits a line-start trigger to the first column of a line", () => {
    expect(at_("/he|", [command])?.start).toBe(0);
    expect(at_("a\n/he|", [command])?.start).toBe(2);
    expect(at_("a /he|", [command])).toBeNull();
  });

  it("runs the query across spaces for a rule that allows them", () => {
    const names: MentionRule = { char: "@", allowSpaces: true };
    expect(at_("hi @Alice Sm|", [names])?.query).toBe("Alice Sm");
    expect(at_("hi @ |", [names])).toBeNull();
    expect(at_("hi @Alice\nSm|", [names])).toBeNull();
    expect(at_("hi @Alice Sm|", [at])).toBeNull();
  });

  it("forgets the trigger past the longest query", () => {
    const short: MentionRule = { char: "@", maxQueryLength: 4 };
    expect(at_("@abcd|", [short])?.query).toBe("abcd");
    expect(at_("@abcde|", [short])).toBeNull();
  });

  it("stays fast on a long text with no trigger", () => {
    const value = "word ".repeat(200_000);
    const start = performance.now();
    for (let n = 0; n < 1000; n++)
      detectMention(value, value.length, [at, hash]);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
