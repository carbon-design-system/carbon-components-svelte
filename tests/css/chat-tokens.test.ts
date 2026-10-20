// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// A chat UI reads the v11 chat-* tokens. In the dark themes the chat shell
// and agent bubbles are the page background; g80 has no v11 values, so its
// chat tokens follow its own surfaces instead of borrowing g90's.
describe("chat tokens", () => {
  it.each(["g80", "g90"])(
    "%s draws the chat shell on the page background",
    async (theme) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const token = (name: string) =>
        [`:root[theme=${theme}]`, ":root"]
          .map((s) =>
            rules.find(
              (r) => r.selector === s && r.context === "" && r.decls.has(name),
            ),
          )
          .find(Boolean)
          ?.decls.get(name);
      const background = token("--cds-background");
      expect(token("--cds-chat-shell-background")).toBe(background);
      expect(token("--cds-chat-bubble-agent")).toBe(background);
      expect(token("--cds-chat-bubble-user")).toBe(token("--cds-layer-01"));
    },
    30_000,
  );
});
