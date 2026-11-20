import {
  getIndexAlphabet,
  getIndexKey,
  groupIndexItems,
  INDEX_OTHER,
} from "../../src/utils/index-groups.js";

const keysOf = (names: string[], locale: string) =>
  names.map((name) => getIndexKey(name, locale));

describe("getIndexKey", () => {
  it("files Latin names under their capital and the rest under #", () => {
    expect(keysOf(["ada", "Zed", "7-Eleven", "", "  mia", "_x"], "en")).toEqual(
      ["A", "Z", INDEX_OTHER, INDEX_OTHER, "M", INDEX_OTHER],
    );
  });

  it("folds German umlauts onto A, O and U, and ß onto S", () => {
    expect(keysOf(["Ärzte", "Österreich", "Über", "Äpfel", "ß"], "de")).toEqual(
      ["A", "O", "U", "A", "S"],
    );
  });

  it("keeps Å, Ä and Ö as letters after Z in Swedish and folds the rest", () => {
    expect(getIndexAlphabet("sv").slice(-4)).toEqual(["Z", "Å", "Ä", "Ö"]);
    expect(keysOf(["Åsa", "Ärlig", "Östen", "Ünal", "Émile"], "sv")).toEqual([
      "Å",
      "Ä",
      "Ö",
      "U",
      "E",
    ]);
  });

  it("uses Æ, Ø, Å for Danish and Norwegian, and Ñ between N and O in Spanish", () => {
    expect(keysOf(["Ærø", "Øl", "Åse"], "nb-NO")).toEqual(["Æ", "Ø", "Å"]);
    expect(keysOf(["Ærø", "Øl"], "en")).toEqual(["A", "O"]);
    expect(getIndexAlphabet("es").slice(13, 16)).toEqual(["N", "Ñ", "O"]);
    expect(keysOf(["Ñandú", "Nube"], "es")).toEqual(["Ñ", "N"]);
  });

  it("files kana by row, whatever the script, voicing or size", () => {
    expect(
      keysOf(
        ["あい", "アイ", "ｱｲ", "がく", "ガク", "ぎ", "ぱ", "っ", "ゔ"],
        "ja",
      ),
    ).toEqual(["あ", "あ", "あ", "か", "か", "か", "は", "た", "あ"]);
    expect(
      keysOf(["さくら", "たなか", "やまだ", "わたなべ", "んー"], "ja"),
    ).toEqual(["さ", "た", "や", "わ", "わ"]);
  });

  it("sends kanji and the long-vowel mark to #, and Latin to its letter, in Japanese", () => {
    expect(keysOf(["田中", "ー", "Smith"], "ja")).toEqual([
      INDEX_OTHER,
      INDEX_OTHER,
      "S",
    ]);
  });

  it("files Han characters under their pinyin initial in Chinese, from the collator", () => {
    expect(
      keysOf(
        ["张三", "李四", "王五", "钱", "秦", "欧阳", "吴", "周", "陈", "曹"],
        "zh-CN",
      ),
    ).toEqual(["Z", "L", "W", "Q", "Q", "O", "W", "Z", "C", "C"]);
    expect(keysOf(["张", "ann"], "zh-Hant")).toEqual(["Z", "A"]);
  });

  it("leaves Han characters in # outside Chinese", () => {
    expect(keysOf(["张"], "en")).toEqual([INDEX_OTHER]);
  });

  it("files Hangul by initial consonant, doubled ones with the single", () => {
    expect(
      keysOf(["가수", "까치", "나비", "다람쥐", "따", "한글", "쌀"], "ko"),
    ).toEqual(["ㄱ", "ㄱ", "ㄴ", "ㄷ", "ㄷ", "ㅎ", "ㅅ"]);
  });

  it("files Arabic by letter, folding hamza forms and ta marbuta", () => {
    expect(getIndexAlphabet("ar")).toHaveLength(28);
    expect(
      keysOf(["أحمد", "إيمان", "آمنة", "ابراهيم", "ؤ", "ئ", "ة", "ى"], "ar"),
    ).toEqual(["ا", "ا", "ا", "ا", "و", "ي", "ه", "ي"]);
    expect(keysOf(["بَسَّام", "Smith"], "ar")).toEqual(["ب", INDEX_OTHER]);
  });

  it("files Hebrew by letter, folding final forms and vowel points", () => {
    expect(getIndexAlphabet("he")).toHaveLength(22);
    expect(keysOf(["אבא", "בֵּית", "ךְ", "ם", "ץ"], "he")).toEqual([
      "א",
      "ב",
      "כ",
      "מ",
      "צ",
    ]);
  });

  it("files Cyrillic by letter, Ё under Е", () => {
    expect(keysOf(["Анна", "Ёлка", "Йорк", "Яна"], "ru")).toEqual([
      "А",
      "Е",
      "Й",
      "Я",
    ]);
  });

  it("falls back to A to Z for a locale with no table, or an invalid one", () => {
    expect(getIndexAlphabet("xx")).toHaveLength(26);
    expect(getIndexAlphabet("en-US")).toHaveLength(26);
    expect(getIndexKey("kofi", "not a locale")).toBe("K");
  });

  it("takes an alphabet of its own", () => {
    expect(getIndexKey("Mia", "en", ["A", "B"])).toBe(INDEX_OTHER);
    expect(getIndexKey("Bea", "en", ["A", "B"])).toBe("B");
  });
});

describe("groupIndexItems", () => {
  const text = (item: { name: string }) => item.name;
  const names = (groups: { items: { name: string }[] }[]) =>
    groups.map((group) => group.items.map(text));

  it("returns every letter of the alphabet, then #, with empty ones empty", () => {
    const groups = groupIndexItems(
      [{ name: "bo" }, { name: "Al" }, { name: "1st" }],
      {
        sortKey: text,
      },
    );
    expect(groups.map((group) => group.key)).toEqual([
      ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      INDEX_OTHER,
    ]);
    expect(
      groups.filter((group) => group.items.length).map((group) => group.key),
    ).toEqual(["A", "B", INDEX_OTHER]);
  });

  it("sorts within a section with the locale's collator", () => {
    const items = ["Åke", "Ärlig", "Ola", "Örjan", "Anna", "Zeke"].map(
      (name) => ({ name }),
    );
    const sv = groupIndexItems(items, { sortKey: text, locale: "sv" });
    expect(names(sv.filter((group) => group.items.length))).toEqual([
      ["Anna"],
      ["Ola"],
      ["Zeke"],
      ["Åke"],
      ["Ärlig"],
      ["Örjan"],
    ]);
    const de = groupIndexItems(items, { sortKey: text, locale: "de" });
    // Å, Ä and Ö fold onto A and O, and sort by their base letter first.
    expect(names(de.filter((group) => group.items.length)).slice(0, 2)).toEqual(
      [
        ["Åke", "Anna", "Ärlig"],
        ["Ola", "Örjan"],
      ],
    );
  });

  it("sorts digits by value", () => {
    const items = ["Row 10", "Row 2", "Row 1"].map((name) => ({ name }));
    const [group] = groupIndexItems(items, { sortKey: text, sections: ["R"] });
    expect(group.items.map(text)).toEqual(["Row 1", "Row 2", "Row 10"]);
  });

  it("keeps the order given when sort is false", () => {
    const items = ["b2", "b1"].map((name) => ({ name }));
    const groups = groupIndexItems(items, { sortKey: text, sort: false });
    expect(names(groups.filter((group) => group.items.length))).toEqual([
      ["b2", "b1"],
    ]);
  });

  it("reads text from items by default", () => {
    const groups = groupIndexItems([{ text: "Zoe" }]);
    expect(groups.find((group) => group.key === "Z")?.items).toEqual([
      { text: "Zoe" },
    ]);
  });

  it("uses the keys groupBy returns, in collation order with # last", () => {
    const items = [{ name: "b" }, { name: "a" }, { name: "x" }, { name: "c" }];
    const groups = groupIndexItems(items, {
      sortKey: text,
      groupBy: (item) =>
        item.name === "x" ? INDEX_OTHER : item.name === "a" ? "É" : "Z",
    });
    expect(groups.map((group) => group.key)).toEqual(["É", "Z", INDEX_OTHER]);
    expect(names(groups)).toEqual([["a"], ["b", "c"], ["x"]]);
  });

  it("puts an item whose key is not in sections under #", () => {
    const groups = groupIndexItems([{ name: "q" }, { name: "a" }], {
      sortKey: text,
      groupBy: (item) => item.name,
      sections: ["A", "a"],
    });
    expect(groups.map((group) => group.key)).toEqual(["A", "a", INDEX_OTHER]);
    expect(names(groups)).toEqual([[], ["a"], ["q"]]);
  });

  it("groups by reading when sortKey returns one", () => {
    const items = [
      { name: "田中", reading: "たなか" },
      { name: "佐藤", reading: "さとう" },
      { name: "鈴木", reading: "すずき" },
    ];
    const groups = groupIndexItems(items, {
      sortKey: (item) => item.reading,
      locale: "ja",
    });
    expect(
      groups
        .filter((group) => group.items.length)
        .map((group) => [group.key, group.items[0].name]),
    ).toEqual([
      ["さ", "佐藤"],
      ["た", "田中"],
    ]);
  });
});
