<script>
  import { IndexedList } from "carbon-components-svelte";

  // ?count=10000&locale=sv&height=480&hideIndex
  const params = new URLSearchParams(location.search);
  const count = Number(params.get("count") ?? 10000);
  const locale = params.get("locale") ?? "en";
  const height = Number(params.get("height") ?? 480);

  const POOLS = {
    en: [
      "Ada,Ben,Cleo,Dev,Eli,Fay,Gus,Hana,Ivy,Jon,Kai,Lena,Max,Nia,Omar,Pia,Quinn,Ravi,Sam,Tess,Uma,Vik,Wes,Xia,Yara,Zed",
      "Adams,Brown,Clark,Diaz,Evans,Fox,Grant,Hill,Irwin,Jones,Kim,Lopez,Moore,Nash,Owens,Park,Quist,Reed,Singh,Tran,Ueda,Vance,Wong,Xu,Young,Zhou",
    ],
    sv: [
      "Anna,Björn,Cecilia,David,Elsa,Filip,Gustav,Hanna,Ida,Johan,Karin,Lars,Maja,Nils,Olof,Petra,Rut,Sven,Tove,Ulla,Viktor,Zeb,Åsa,Ärlig,Östen",
      "Andersson,Berg,Carlsson,Dahl,Ek,Fors,Gren,Holm,Isaksson,Jansson,Karlsson,Lind,Månsson,Nilsson,Olsson,Persson,Sjöberg,Åberg,Ärnström,Öman",
    ],
    de: [
      "Anja,Bernd,Clara,Dieter,Emil,Frieda,Gerd,Heidi,Jörg,Karl,Lukas,Mia,Nora,Otto,Paul,Ralf,Sina,Tom,Uwe,Vera,Åke,Ärzte,Özlem,Ümit",
      "Bauer,Fischer,Hoffmann,Köhler,Müller,Neumann,Schäfer,Schmidt,Wagner,Zimmer,Österreich,Übel",
    ],
    ja: [
      "あおい,いちろう,うみ,えり,おさむ,かおる,きく,くみ,けんた,こうじ,さくら,しおり,すみれ,せいじ,そら,たくみ,ちあき,つばさ,てるお,とおる,なつみ,にこ,ぬい,ねね,のぞみ,はるか,ひなた,ふみ,へいた,ほまれ,まこと,みさき,むつみ,めぐみ,もも,やよい,ゆうき,よしの,らん,りく,るい,れん,ろく,わかな",
      "さとう,すずき,たかはし,たなか,いとう,わたなべ,やまもと,なかむら,こばやし,かとう",
    ],
    ar: [
      "أحمد,بسام,تامر,ثائر,جمال,حسن,خالد,داود,ذياب,رامي,زياد,سامي,شادي,صالح,ضياء,طارق,ظافر,عمر,غسان,فادي,قاسم,كريم,ليث,محمد,نادر,هشام,وليد,يوسف,إبراهيم,آمنة,أنور,ؤي,ئاد",
      "العلي,الحسن,النجار,الخطيب,الشامي,البكري",
    ],
    zh: [
      "张伟,李娜,王芳,刘洋,陈静,杨磊,赵敏,黄勇,周杰,吴丹,徐强,孙丽,马超,朱婷,胡军,郭琳,何平,高峰,林涛,钱多,曹操,邓超,欧阳娜,秦岚,冯远",
      "",
    ],
  };

  /** @param {string} locale */
  function build(locale, count) {
    const [firsts, lasts] = (POOLS[locale] ?? POOLS.en).map((pool) =>
      pool.split(",").filter(Boolean),
    );
    let seed = 7;
    const next = (/** @type {number} */ n) => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed >>> 8) % n;
    };
    return Array.from({ length: count }, (_, id) => {
      const first = firsts[next(firsts.length)];
      const last = lasts.length ? lasts[next(lasts.length)] : "";
      const name = `${first} ${last}`.trim();
      return { id, name: id % 97 === 0 ? `${id} ${name}` : name };
    });
  }

  const contacts = build(locale, count);
</script>

<IndexedList
  items={contacts}
  itemToString={(contact) => contact.name}
  {locale}
  {height}
  labelText="Contacts"
  hideIndex={params.has("hideIndex")}
  jumpLabel={({ key, count }) => `Jump to ${key}, ${count} contacts`}
  announcement={({ key, count }) => `Section ${key}, ${count} contacts`}
  data-testid="indexed-list"
  let:item
>
  <span data-testid="row">{item.name}</span>
</IndexedList>
<!-- Safari tabs past a button with no tabindex, so the page has a stop after the list. -->
<button type="button" tabindex="0">After the list</button>
