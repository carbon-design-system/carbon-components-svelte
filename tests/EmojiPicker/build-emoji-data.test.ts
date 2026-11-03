// @vitest-environment node
import {
  buildEmojiDataset,
  parseAnnotations,
  parseEmojiTest,
  renderEmojiModule,
} from "../../scripts/lib/emoji-data";

const EMOJI_TEST = `# group: Smileys & Emotion

# subgroup: face-smiling
1F600                                                  ; fully-qualified     # 😀 E1.0 grinning face
263A FE0F                                              ; fully-qualified     # ☺\u{FE0F} E0.6 smiling face
263A                                                   ; unqualified         # ☺ E0.6 smiling face

# group: People & Body

# subgroup: hand-fingers-open
1F44D                                                  ; fully-qualified     # 👍 E0.6 thumbs up
1F44D 1F3FB                                            ; fully-qualified     # 👍🏻 E1.0 thumbs up: light skin tone
1F44D 1F3FC                                            ; fully-qualified     # 👍🏼 E1.0 thumbs up: medium-light skin tone
1F44D 1F3FD                                            ; fully-qualified     # 👍🏽 E1.0 thumbs up: medium skin tone
1F44D 1F3FE                                            ; fully-qualified     # 👍🏾 E1.0 thumbs up: medium-dark skin tone
1F44D 1F3FF                                            ; fully-qualified     # 👍🏿 E1.0 thumbs up: dark skin tone

# group: Component

# subgroup: skin-tone
1F3FB                                                  ; component           # 🏻 E1.0 light skin tone
`;

const ANNOTATIONS = `<annotations>
<annotation cp="😀">cheerful | grin | grinning face</annotation>
<annotation cp="😀" type="tts">grinning face</annotation>
<annotation cp="☺">happy | smile | smiley &amp; more</annotation>
<annotation cp="👍">+1 | like | thumbs up</annotation>
</annotations>`;

describe("parseEmojiTest", () => {
  const parsed = parseEmojiTest(EMOJI_TEST);

  it("reads the fully qualified emoji with their group and version", () => {
    expect(parsed[0]).toEqual({
      glyph: "\u{1F600}",
      name: "grinning face",
      version: 1,
      group: "Smileys & Emotion",
    });
    expect(parsed[1].glyph).toBe("☺\u{FE0F}");
  });

  it("leaves out the unqualified forms and the component group", () => {
    expect(parsed.map((emoji) => emoji.glyph)).not.toContain("☺");
    expect(parsed.map((emoji) => emoji.group)).not.toContain("Component");
  });
});

describe("parseAnnotations", () => {
  it("reads keywords by glyph, without variation selectors, and decodes entities", () => {
    const keywords = parseAnnotations(ANNOTATIONS);
    expect(keywords.get("\u{1F600}")).toEqual([
      "cheerful",
      "grin",
      "grinning face",
    ]);
    expect(keywords.get("☺")).toEqual(["happy", "smile", "smiley & more"]);
  });
});

describe("buildEmojiDataset", () => {
  const dataset = buildEmojiDataset(
    parseEmojiTest(EMOJI_TEST),
    parseAnnotations(ANNOTATIONS),
  );

  it("writes one string for each emoji, with the keywords the name does not hold", () => {
    const [smileys, people] = dataset.groups;
    expect(smileys.id).toBe("smileys-emotion");
    // "grinning face" is the name, so only "cheerful" and "grin" remain.
    expect(smileys.emoji[0]).toBe("\u{1F600};grinning face;1;;cheerful|grin");
    expect(people.emoji).toEqual(["\u{1F44D};thumbs up;0.6;0;+1|like"]);
  });

  it("leaves the skin tone variants out and says where the modifier goes", () => {
    expect(dataset.stats).toMatchObject({ emoji: 3, withTones: 1 });
  });

  it("fails when Unicode lists a variant that is not the one written", () => {
    const stale = EMOJI_TEST.replace("1F44D 1F3FF", "1F44D 1F3FF 200D 2642");
    expect(() =>
      buildEmojiDataset(parseEmojiTest(stale), parseAnnotations(ANNOTATIONS)),
    ).toThrow();
  });
});

describe("renderEmojiModule", () => {
  it("writes a module and its types", () => {
    const { js, dts } = renderEmojiModule(
      buildEmojiDataset(parseEmojiTest(EMOJI_TEST), new Map()),
    );
    expect(js).toContain("export const emojiVersion = 1;");
    expect(js).toContain("export default emojiGroups;");
    expect(dts).toContain("export const emojiGroups: EmojiDataGroup[];");
  });
});
