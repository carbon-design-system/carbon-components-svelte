---
description: An indexed list groups a long list into lettered sections under sticky headers, with a rail of letters to jump to a section.
---

<script>
  import { Box, IndexedList, LayoutDirection, Text } from "carbon-components-svelte";

  const firstNames = "Aisha,Amara,Ben,Camila,Chen,Dara,Diego,Elif,Emeka,Farah,Gabriel,Hana,Hugo,Imani,Ivan,Jia,Kofi,Laila,Mateo,Mei,Nadia,Noor,Olivia,Omar,Priya,Quinn,Rafael,Sofia,Tariq,Uma,Wei,Yara,Zane".split(",");
  const lastNames = "Adeyemi,Banerjee,Castillo,Dubois,Eriksen,Fofana,Garcia,Haddad,Ito,Jovanovic,Khan,Lindqvist,Mensah,Nakamura,Okafor,Petrov,Quispe,Rossi,Santos,Tanaka,Umar,Vargas,Weber,Xu,Yilmaz,Zhang".split(",");

  function makeContacts(length) {
    let seed = 11;
    const next = (limit) => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed >>> 8) % limit;
    };
    return Array.from({ length }, (_, id) => {
      const name = `${firstNames[next(firstNames.length)]} ${lastNames[next(lastNames.length)]}`;
      return { id, name, phone: `+1 555 01${String(next(100)).padStart(2, "0")}` };
    });
  }

  const contacts = makeContacts(2000);
  const manyContacts = makeContacts(10000);

  const terms = [
    { term: "Availability zone", definition: "An isolated location in a region with its own power and network." },
    { term: "Blue-green deployment", definition: "Two identical environments, one live, switched at release." },
    { term: "Bucket", definition: "A container for objects in cloud storage." },
    { term: "Canary release", definition: "A rollout to a small share of traffic before everyone." },
    { term: "CIDR block", definition: "A range of IP addresses written as an address and a prefix length." },
    { term: "Container registry", definition: "A service that stores and serves container images." },
    { term: "Dead-letter queue", definition: "A queue for messages that could not be processed." },
    { term: "Egress", definition: "Traffic that leaves a network." },
    { term: "Failover", definition: "Switching to a standby system when the primary fails." },
    { term: "Garbage collection", definition: "Reclaiming memory that a program no longer uses." },
    { term: "Health check", definition: "A probe that decides whether an instance can take traffic." },
    { term: "Idempotency key", definition: "A token that makes a repeated request safe to retry." },
    { term: "Ingress", definition: "Traffic that enters a network or cluster." },
    { term: "Load balancer", definition: "Spreads requests across a pool of instances." },
    { term: "Namespace", definition: "A scope that separates resources in a cluster." },
    { term: "Observability", definition: "How well a system's state can be told from its outputs." },
    { term: "Pod", definition: "The smallest deployable unit in Kubernetes." },
    { term: "Quota", definition: "A limit on how much of a resource an account may use." },
    { term: "Rate limiting", definition: "Capping how many requests a client may make in a period." },
    { term: "Service mesh", definition: "A layer that handles traffic between services." },
    { term: "Throttling", definition: "Slowing requests to protect a service from overload." },
    { term: "Virtual private cloud", definition: "A private network inside a public cloud." },
    { term: "Webhook", definition: "An HTTP callback sent when an event happens." },
    { term: "Zero-downtime deploy", definition: "A release that never interrupts service." },
    { term: "99th percentile", definition: "The latency that 99 in 100 requests beat." },
  ];

  const swedish = "Agneta Andersson,Anders Åberg,Björn Berg,Cecilia Carlsson,Dan Dahl,Elsa Ek,Erik Östlund,Filip Fors,Gustav Gren,Hanna Holm,Ida Isaksson,Johan Jansson,Karin Karlsson,Lars Lind,Maja Månsson,Märta Ärnström,Nils Nilsson,Olof Olsson,Östen Öman,Petra Persson,Rut Rydberg,Sven Sjöberg,Tove Thorén,Ulla Ullman,Viktor Vik,Åsa Åkesson,Ärlig Ärlander,Örjan Öberg,Zeb Zetterberg".split(",").map((name, id) => ({ id, name }));

  const german = "Anja Albers,Ärztin Anders,Bernd Bauer,Clara Cramer,Dieter Dietz,Emil Engel,Frieda Fischer,Gerd Graf,Heidi Hoffmann,Jörg Jäger,Karl Köhler,Lukas Lang,Mia Müller,Nora Neumann,Otto Österreicher,Paul Peters,Ralf Richter,Sina Schäfer,Tom Thiel,Uwe Übel,Ümit Ünal,Vera Vogel,Wolfgang Wagner,Zora Zimmer".split(",").map((name, id) => ({ id, name }));

  const japanese = [
    ["青木 葵", "あおき あおい"], ["石井 一郎", "いしい いちろう"], ["上田 海", "うえだ うみ"], ["遠藤 絵里", "えんどう えり"],
    ["岡田 修", "おかだ おさむ"], ["加藤 薫", "かとう かおる"], ["木村 菊", "きむら きく"], ["工藤 久美", "くどう くみ"],
    ["小林 健太", "こばやし けんた"], ["斎藤 幸二", "さいとう こうじ"], ["佐藤 さくら", "さとう さくら"], ["鈴木 しおり", "すずき しおり"],
    ["関 すみれ", "せき すみれ"], ["高橋 拓海", "たかはし たくみ"], ["田中 千秋", "たなか ちあき"], ["遠山 翼", "とおやま つばさ"],
    ["中村 夏美", "なかむら なつみ"], ["西村 仁", "にしむら じん"], ["野口 望", "のぐち のぞみ"], ["橋本 はるか", "はしもと はるか"],
    ["原田 陽向", "はらだ ひなた"], ["藤田 史", "ふじた ふみ"], ["本田 誠", "ほんだ まこと"], ["松本 美咲", "まつもと みさき"],
    ["宮崎 恵", "みやざき めぐみ"], ["森 桃", "もり もも"], ["山田 やよい", "やまだ やよい"], ["吉田 悠希", "よしだ ゆうき"],
    ["渡辺 若菜", "わたなべ わかな"], ["ヴィクター 高田", "ゔぃくたー たかだ"], ["Chris Hayashi", "Chris Hayashi"],
  ].map(([name, reading], id) => ({ id, name, reading }));

  const chinese = "张伟,李娜,王芳,刘洋,陈静,杨磊,赵敏,黄勇,周杰,吴丹,徐强,孙丽,马超,朱婷,胡军,郭琳,何平,高峰,林涛,钱多,曹操,邓超,欧阳娜,秦岚,冯远,Ann Zhou".split(",").map((name, id) => ({ id, name }));

  const arabic = "أحمد العلي,آمنة البكري,إبراهيم الحسن,بسام النجار,تامر الخطيب,جمال الشامي,حسن الصالح,خالد المصري,داود العمر,رامي القاسم,زياد الحداد,سامي الأحمد,شادي الجبوري,صالح التميمي,طارق الزعبي,عمر الكردي,غسان الدباغ,فادي الراشد,قاسم الفارس,كريم الليثي,ليث المهدي,محمد النعيمي,نادر الهاشمي,هشام الوزير,وليد اليمني,يوسف الأنصاري".split(",").map((name, id) => ({ id, name }));

  const hebrew = "אברהם כהן,בנימין לוי,גלית מזרחי,דוד פרץ,הדס ביטון,ורד דהן,זיו אברהם,חנה פרידמן,טל מלכה,יעל אזולאי,כרמל גולן,לאה עמר,מיכל חדד,נועם שפירא,סיגל אוחיון,עומר קליין,פנינה רוזן,צחי ברק,קובי שמש,רונית גבאי,שירה טל,תמר ביבס".split(",").map((name, id) => ({ id, name }));

  const departments = [
    { id: 1, name: "Billing and invoices", group: "Finance" },
    { id: 2, name: "Payroll", group: "Finance" },
    { id: 3, name: "Procurement", group: "Finance" },
    { id: 4, name: "Brand and design", group: "Marketing" },
    { id: 5, name: "Events", group: "Marketing" },
    { id: 6, name: "Social media", group: "Marketing" },
    { id: 7, name: "Platform engineering", group: "Engineering" },
    { id: 8, name: "Site reliability", group: "Engineering" },
    { id: 9, name: "Security", group: "Engineering" },
    { id: 10, name: "Recruiting", group: "People" },
    { id: 11, name: "Learning and development", group: "People" },
  ];

  let list;
  let currentSection;
</script>

## Basic

`IndexedList` sorts `items` and files each one under the first letter of its text, in sections under sticky headers. Set `itemToString` to return the text an item sorts and files by, and render each row through the default slot with `let:item`.

An index rail of letters sits on the inline-end edge. Tap a letter, or press and drag along the rail to scrub through the sections with a bubble that shows the letter under your finger. Digits and symbols file under `#`. A letter with no items is dimmed and cannot be chosen.

The list renders only the rows in view, from the height of each row, so a long list stays fast. Every row is `itemHeight` tall and every header is `headerHeight` tall, both in pixels. Content that is taller is clipped.

<IndexedList items={contacts} itemToString={(contact) => contact.name} labelText="Contacts" let:item>
  <Box display="flex" align="center" justify="space-between" fullWidth>
    <Text type="inherit">{item.name}</Text>
    <Text type="inherit" color="secondary">{item.phone}</Text>
  </Box>
</IndexedList>

## Index rail

### Keyboard

Press <DocKbd label="Tab" /> to move focus to the rail, which is one tab stop. <DocKbd label="ArrowDown" /> and <DocKbd label="ArrowUp" /> move between letters, skipping letters with no items, and <DocKbd label="Home" /> and <DocKbd label="End" /> go to the first and last. <DocKbd label="Enter" /> or <DocKbd label="Space" /> jumps to the section and moves focus to its header, so <DocKbd label="Tab" /> continues into the rows. Type a letter to jump straight to it. Dragging across the rail has this keyboard equivalent, so no one needs a gesture to use it.

The scrolling list is a tab stop of its own, so the arrow keys, <DocKbd label="PageDown" /> and <DocKbd label="PageUp" /> scroll it.

A screen reader reads each letter as "Jump to M, 42 items", and a polite live region announces "Section M, 42 items" after a jump. Set `jumpLabel` and `announcement` to name what the list holds, and `indexLabelText` and `labelText` to translate the labels.

<IndexedList
  items={contacts}
  itemToString={(contact) => contact.name}
  labelText="Contacts"
  indexLabelText="Contact index"
  jumpLabel={({ key, count }) => `Jump to ${key}, ${count} contacts`}
  announcement={({ key, count }) => `Section ${key}, ${count} contacts`}
  let:item
>
  {item.name}
</IndexedList>

### Short lists

When the list is too short for every letter at `indexSize` (24 pixels, the smallest touch target WCAG allows), the rail shows every other letter, or fewer, and a dot for each one it leaves out. Every letter is still a button for the keyboard and a screen reader, and dragging across a dot reaches the letters it stands for.

<IndexedList items={contacts} itemToString={(contact) => contact.name} labelText="Contacts" height={240} let:item>
  {item.name}
</IndexedList>

### Hidden

Set `hideIndex` to `true` for a list that only needs sticky headers, such as a narrow list that fits the section headers alone.

<IndexedList items={contacts} itemToString={(contact) => contact.name} labelText="Contacts" hideIndex height={240} let:item>
  {item.name}
</IndexedList>

## Section headers

### Glossary

A section with no items has no header, and its letter is dimmed. A glossary of 25 terms leaves most letters empty. Use the `header` slot to change what a header shows. It gets the `section` and its `count`.

<IndexedList items={terms} itemToString={(entry) => entry.term} labelText="Glossary" itemHeight={72} height={400} let:item>
  <Box display="flex" direction="column" gap={1}>
    <strong>{item.term}</strong>
    <Text type="inherit" color="secondary">{item.definition}</Text>
  </Box>
  <svelte:fragment slot="header" let:section let:count>
    {section}
    <Text type="inherit" color="secondary">&nbsp;({count})</Text>
  </svelte:fragment>
</IndexedList>

### Empty

Without items, the list shows its `empty` slot and no rail.

<IndexedList items={[]} labelText="Contacts" height={160}>
  <svelte:fragment slot="empty">
    <Box padding={5}>
      <Text type="inherit" color="secondary">No contacts match your filters.</Text>
    </Box>
  </svelte:fragment>
</IndexedList>

## Locales

Set `locale` to a BCP 47 tag. It picks the letters on the rail and the sort order, through `Intl.Collator`. It is not read from the page, so the server and the browser render the same list.

| Locale | Letters | Notes |
| --- | --- | --- |
| Most languages | A to Z, then `#` | An accented letter files under its base letter. |
| `sv`, `fi` | A to Z, then Å, Ä, Ö | These sort after Z. |
| `da`, `nb`, `nn`, `no` | A to Z, then Æ, Ø, Å | |
| `es` | A to N, Ñ, O to Z | |
| `de` | A to Z, then `#` | Ä, Ö and Ü file under A, O and U. |
| `ja` | あ か さ た な は ま や ら わ, then A to Z, then `#` | Katakana, voicing marks and small kana file with their row. |
| `zh` | A to Z, then `#` | Han characters file under their pinyin initial. |
| `ko` | ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ, then A to Z | Double consonants file with the single one. |
| `ru` | А to Я | Ё files under Е. |
| `ar` | The 28 letters, from ا to ي | Hamza forms file under ا, ة under ه and ى under ي. |
| `he` | The 22 letters, from א to ת | Final forms file under their base letter. |

### Swedish

<IndexedList items={swedish} itemToString={(person) => person.name} locale="sv" labelText="Kontakter" height={360} let:item>
  {item.name}
</IndexedList>

### German

The umlauts fold into A, O and U, as they do in a German phone book.

<IndexedList items={german} itemToString={(person) => person.name} locale="de" labelText="Kontakte" height={360} let:item>
  {item.name}
</IndexedList>

### Japanese

Kanji have no letter of their own, so names written in them file under `#`. Return the reading from `itemToString` to sort and file by it, and show the name in the slot.

<IndexedList items={japanese} itemToString={(person) => person.reading} locale="ja" labelText="連絡先" height={400} let:item>
  <Box display="flex" direction="column">
    <Text type="inherit">{item.name}</Text>
    <Text type="inherit" color="secondary">{item.reading}</Text>
  </Box>
</IndexedList>

### Chinese

Han characters file under their pinyin initial, read from the browser's pinyin collation with no table of characters. Names in other scripts file under their own letter.

<IndexedList items={chinese} itemToString={(person) => person.name} locale="zh" labelText="联系人" height={360} let:item>
  {item.name}
</IndexedList>

### Arabic and Hebrew

Wrap the list in `LayoutDirection` or set `dir` on the page. The rail moves to the left edge, the inline end of a right-to-left page.

<LayoutDirection dir="rtl" lang="ar">
  <IndexedList items={arabic} itemToString={(person) => person.name} locale="ar" labelText="جهات الاتصال" indexLabelText="الفهرس" height={360} let:item>
    {item.name}
  </IndexedList>
</LayoutDirection>

<LayoutDirection dir="rtl" lang="he">
  <IndexedList items={hebrew} itemToString={(person) => person.name} locale="he" labelText="אנשי קשר" indexLabelText="אינדקס" height={360} let:item>
    {item.name}
  </IndexedList>
</LayoutDirection>

## Custom grouping

Set `groupBy` for letters the tables do not cover, or for sections that are not letters at all. It gets the item and the locale and returns the section's key. Set `sections` to put the sections in order. Without `sections`, the keys `groupBy` returns are sorted with the locale's collator and `#` goes last.

<IndexedList items={departments} itemToString={(department) => department.name} groupBy={(department) => department.group} sections={["Engineering", "Finance", "Marketing", "People"]} labelText="Departments" height={320} itemHeight={48} let:item>
  {item.name}
</IndexedList>

## Large lists

Only the rows in view are in the page, so 10,000 contacts cost no more than 20. Sorting and filing 10,000 items takes about 10 ms, and 100,000 about 100 ms, and it runs again only when `items`, `locale`, `groupBy` or `sections` change. A browser scrolls only so far (about 17.9 million pixels in Firefox), so the list holds about 300,000 items at the default height. Page or filter a list larger than that.

<IndexedList items={manyContacts} itemToString={(contact) => contact.name} labelText="All contacts" let:item>
  <Box display="flex" align="center" justify="space-between" fullWidth>
    <Text type="inherit">{item.name}</Text>
    <Text type="inherit" color="secondary">{item.phone}</Text>
  </Box>
</IndexedList>

| Do | Why |
| --- | --- |
| Keep every row at `itemHeight`, and every header at `headerHeight` | Each row's place is worked out from these heights, so a row that grows is clipped. |
| Pass `locale` for names in another language | The default alphabet is A to Z, so `Å` in a Swedish list files under `A`. |
| Return a reading from `itemToString` for kanji and other characters with no letter | Sorting by the characters puts them under `#`. |
| Pass a stable `items` array | Every new array sorts and files the list again. |
| Name the rail's letters with `jumpLabel` | "Jump to M, 42 contacts" says more than "42 items". |

## Programmatic

Call `scrollToSection` to jump to a section from code, and bind `currentSection` to read the letter at the top of the list. Pass `focus: true` to move focus to the section header.

<FileSource src="/framed/IndexedList/IndexedListProgrammatic" />
