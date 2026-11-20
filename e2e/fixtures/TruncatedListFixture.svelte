<script>
  import { TruncatedList } from "carbon-components-svelte";

  const people = [
    "Ada Lovelace",
    "Grace Hopper",
    "Alan Turing",
    "Edsger Dijkstra",
    "Barbara Liskov",
    "Margaret Hamilton",
    "Donald Knuth",
    "Katherine Johnson",
  ];

  const linked = people.map((label) => ({
    label,
    href: `#${label.toLowerCase().replace(" ", "-")}`,
  }));

  const thousand = Array.from({ length: 1000 }, (_, i) => `Person ${i + 1}`);

  const japanese = [
    "山田 太郎",
    "佐藤 花子",
    "鈴木 一郎",
    "田中 美咲",
    "高橋 健",
  ];
  const chinese = ["王伟", "李娜", "张敏", "刘洋", "陈静"];
  const arabic = [
    "أحمد علي",
    "فاطمة حسن",
    "محمد خالد",
    "ليلى سعيد",
    "عمر يوسف",
  ];
  const german = ["Anna Müller", "Jonas Schmidt", "Lena Fischer", "Paul Weber"];

  const translations = {
    de: {
      "more.one": "{count} weiterer",
      "more.other": "{count} weitere",
      less: "Weniger anzeigen",
    },
    ja: { "more.other": "他{count}件" },
    zh: { "more.other": "另外{count}人" },
    ar: {
      "more.one": "{count} آخر",
      "more.two": "{count} آخران",
      "more.few": "{count} آخرين",
      "more.many": "{count} آخرين",
      "more.other": "{count} آخرين",
    },
  };
  const translate = (locale) => (id) => translations[locale][id];
</script>

<main
  style="display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; max-inline-size: 36rem; padding: 2rem 1rem;"
>
  <section>
    <h2 class="bx--type-productive-heading-02">Count</h2>
    <p>
      Assigned to
      <TruncatedList data-testid="count" items={people} max={2} />
    </p>
    <p>
      Linked
      <TruncatedList data-testid="linked" items={linked} max={2} />
    </p>
    <p>
      Or
      <TruncatedList
        data-testid="disjunction"
        items={people}
        max={2}
        type="disjunction"
      />
    </p>
    <p>
      Expand
      <TruncatedList
        data-testid="expand"
        items={people}
        max={2}
        overflow="expand"
      />
    </p>
    <p>
      Title
      <TruncatedList
        data-testid="title"
        items={people}
        max={2}
        overflow="title"
      />
    </p>
    <p>
      None
      <TruncatedList
        data-testid="none"
        items={people}
        max={2}
        overflow="none"
      />
    </p>
    <p>
      Thousand
      <TruncatedList data-testid="thousand" items={thousand} max={3} />
    </p>
  </section>

  <section>
    <h2 class="bx--type-productive-heading-02">Width</h2>
    <div data-testid="box" style="inline-size: min(20rem, 100%);">
      <TruncatedList
        data-testid="fit"
        items={people}
        max={Number.POSITIVE_INFINITY}
        fit="width"
      />
    </div>
    <div data-testid="box-linked" style="inline-size: min(20rem, 100%);">
      <TruncatedList
        data-testid="fit-linked"
        items={linked}
        max={Number.POSITIVE_INFINITY}
        fit="width"
      />
    </div>
    <div
      data-testid="row"
      style="display: flex; align-items: center; gap: 1rem; inline-size: min(24rem, 100%);"
    >
      <TruncatedList
        data-testid="fit-row"
        items={people}
        max={Number.POSITIVE_INFINITY}
        fit="width"
      />
      <button type="button" class="bx--btn bx--btn--sm bx--btn--primary"
        >Share</button
      >
    </div>
    <div data-testid="box-long" style="inline-size: min(6rem, 100%);">
      <TruncatedList
        data-testid="fit-long"
        items={people}
        max={Number.POSITIVE_INFINITY}
        fit="width"
      />
    </div>
    <div data-testid="box-thousand" style="inline-size: min(24rem, 100%);">
      <TruncatedList
        data-testid="fit-thousand"
        items={thousand}
        max={Number.POSITIVE_INFINITY}
        fit="width"
      />
    </div>
  </section>

  <section>
    <h2 class="bx--type-productive-heading-02">Locales</h2>
    <p>
      <TruncatedList
        data-testid="locale-en-GB"
        items={people}
        max={2}
        locale="en-GB"
      />
    </p>
    <p>
      <TruncatedList
        data-testid="locale-de"
        items={german}
        max={2}
        locale="de"
        translateWithId={translate("de")}
      />
    </p>
    <p>
      <TruncatedList
        data-testid="locale-ja"
        items={japanese}
        max={2}
        locale="ja"
        translateWithId={translate("ja")}
      />
    </p>
    <p>
      <TruncatedList
        data-testid="locale-zh"
        items={chinese}
        max={2}
        locale="zh"
        translateWithId={translate("zh")}
      />
    </p>
    <p>
      <TruncatedList
        data-testid="locale-ar"
        items={arabic}
        max={2}
        locale="ar"
        translateWithId={translate("ar")}
      />
    </p>
    <div data-testid="box-ar" style="inline-size: min(16rem, 100%);">
      <TruncatedList
        data-testid="fit-ar"
        items={arabic}
        max={Number.POSITIVE_INFINITY}
        fit="width"
        locale="ar"
        translateWithId={translate("ar")}
      />
    </div>
  </section>
</main>
