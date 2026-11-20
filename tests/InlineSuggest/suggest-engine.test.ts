// @vitest-environment node
import {
  appendedText,
  canSuggest,
  completeFromList,
  firstWord,
  fitMaxLength,
  fragmentBeforeCaret,
  keyAction,
  typeThrough,
} from "../../src/InlineSuggest/suggest-engine.js";

describe("fragmentBeforeCaret", () => {
  it("takes the text before the caret by scope", () => {
    const value = "dear ada\nsee you at the offi";
    expect(fragmentBeforeCaret(value, value.length)).toBe(value);
    expect(fragmentBeforeCaret(value, value.length, { scope: "line" })).toBe(
      "see you at the offi",
    );
    expect(fragmentBeforeCaret(value, value.length, { scope: "word" })).toBe(
      "offi",
    );
    expect(fragmentBeforeCaret("ada@gm and more", 6)).toBe("ada@gm");
  });

  it("narrows to what follows the last marker, or none without it", () => {
    expect(fragmentBeforeCaret("ada@gm", 6, { after: "@" })).toBe("gm");
    expect(fragmentBeforeCaret("a@b@c", 5, { after: "@" })).toBe("c");
    expect(fragmentBeforeCaret("ada", 3, { after: "@" })).toBeNull();
    expect(fragmentBeforeCaret("ada@", 4, { after: "@" })).toBe("");
  });
});

describe("completeFromList", () => {
  const domains = ["gmail.com", "github.com", "gmx.net"];

  it("returns the tail of the first candidate in list order", () => {
    expect(completeFromList(domains, "g")).toBe("mail.com");
    expect(completeFromList(domains, "gi")).toBe("thub.com");
    expect(completeFromList(domains, "gm")).toBe("ail.com");
    expect(completeFromList(domains, "gmx")).toBe(".net");
  });

  it("keeps the typed casing and can be made case sensitive", () => {
    expect(completeFromList(domains, "GM")).toBe("ail.com");
    expect(completeFromList(domains, "GM", { ignoreCase: false })).toBe("");
  });

  it("offers nothing for an exact match, a miss or a short fragment", () => {
    expect(completeFromList(domains, "gmail.com")).toBe("");
    expect(completeFromList(domains, "yahoo")).toBe("");
    expect(completeFromList(domains, "")).toBe("");
    expect(completeFromList(domains, "", { minLength: 0 })).toBe("gmail.com");
    expect(completeFromList(domains, "g", { minLength: 2 })).toBe("");
  });

  it("compares lowercased text that changes length", () => {
    expect(completeFromList(["İstanbul"], "İst")).toBe("anbul");
  });
});

describe("typing through a suggestion", () => {
  it("finds what was appended, and nothing for other edits", () => {
    expect(appendedText("ada@g", "ada@gm")).toBe("m");
    expect(appendedText("ada@g", "ada@gma")).toBe("ma");
    expect(appendedText("ada@g", "ada@")).toBeNull();
    expect(appendedText("ada@g", "adax@g")).toBeNull();
    expect(appendedText("ada@g", "ada@g")).toBeNull();
  });

  it("keeps the rest while the typing matches, and reports a full match as empty", () => {
    expect(typeThrough("mail.com", "m")).toBe("ail.com");
    expect(typeThrough("mail.com", "ma")).toBe("il.com");
    expect(typeThrough("mail.com", "mail.com")).toBe("");
    expect(typeThrough("mail.com", "x")).toBeNull();
    expect(typeThrough("mail.com", "mail.comm")).toBeNull();
    expect(typeThrough("mail.com", "M")).toBe("ail.com");
    expect(typeThrough("mail.com", "M", false)).toBeNull();
  });
});

describe("firstWord", () => {
  it("takes the leading space and the first word", () => {
    expect(firstWord(" the quick brown fox")).toBe(" the");
    expect(firstWord("quick brown")).toBe("quick");
    expect(firstWord(", and then")).toBe(", and");
  });

  it("keeps a domain together and falls back to all of a word-less tail", () => {
    expect(firstWord("mail.com")).toBe("mail.com");
    expect(firstWord(" ...")).toBe(" ...");
    expect(firstWord("")).toBe("");
  });
});

describe("fitMaxLength", () => {
  it("cuts to the room that is left, never through a surrogate pair", () => {
    expect(fitMaxLength("hello", 3, 6)).toBe("hel");
    expect(fitMaxLength("hello", 3, 20)).toBe("hello");
    expect(fitMaxLength("hello", 3, -1)).toBe("hello");
    expect(fitMaxLength("hello", 6, 6)).toBe("");
    expect(fitMaxLength("a😀b", 0, 2)).toBe("a");
  });
});

describe("canSuggest", () => {
  const field = { value: "abc", selectionStart: 3, selectionEnd: 3 };

  it("needs a collapsed caret at the end of an enabled field", () => {
    expect(canSuggest(field)).toBe(true);
    expect(canSuggest({ ...field, selectionStart: 1, selectionEnd: 1 })).toBe(
      false,
    );
    expect(canSuggest({ ...field, selectionStart: 0 })).toBe(false);
    expect(canSuggest({ ...field, disabled: true })).toBe(false);
    expect(canSuggest({ ...field, readOnly: true })).toBe(false);
  });

  it("is off during composition", () => {
    expect(canSuggest(field, { composing: true })).toBe(false);
  });
});

describe("keyAction", () => {
  it("maps Tab, the arrow along the line, and Escape", () => {
    expect(keyAction({ key: "Tab" })).toBe("accept");
    expect(keyAction({ key: "ArrowRight" })).toBe("accept");
    expect(keyAction({ key: "Escape" })).toBe("dismiss");
    expect(keyAction({ key: "ArrowLeft" })).toBeNull();
    expect(keyAction({ key: "a" })).toBeNull();
  });

  it("flips the arrow in a right-to-left field", () => {
    expect(keyAction({ key: "ArrowLeft" }, { rtl: true })).toBe("accept");
    expect(keyAction({ key: "ArrowRight" }, { rtl: true })).toBeNull();
  });

  it("accepts a word with Ctrl or Alt, unless turned off", () => {
    expect(keyAction({ key: "ArrowRight", ctrlKey: true })).toBe("word");
    expect(keyAction({ key: "ArrowRight", altKey: true })).toBe("word");
    expect(
      keyAction({ key: "ArrowRight", ctrlKey: true }, { acceptWord: false }),
    ).toBeNull();
  });

  it("never takes Shift+Tab, Meta or Shift selection keys", () => {
    expect(keyAction({ key: "Tab", shiftKey: true })).toBeNull();
    expect(keyAction({ key: "Tab", ctrlKey: true })).toBeNull();
    expect(keyAction({ key: "ArrowRight", shiftKey: true })).toBeNull();
    expect(keyAction({ key: "ArrowRight", metaKey: true })).toBeNull();
    expect(keyAction({ key: "Escape", metaKey: true })).toBeNull();
  });

  it("leaves Tab to move focus when it is not an accept key", () => {
    const acceptKeys = ["ArrowRight"] as const;
    expect(keyAction({ key: "Tab" }, { acceptKeys })).toBeNull();
    expect(keyAction({ key: "ArrowRight" }, { acceptKeys })).toBe("accept");
    expect(
      keyAction({ key: "ArrowRight" }, { acceptKeys: ["Tab"] }),
    ).toBeNull();
  });
});
