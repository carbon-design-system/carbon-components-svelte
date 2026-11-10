const FIRST = [
  "Ada",
  "Grace",
  "Alan",
  "Linus",
  "Margaret",
  "Dennis",
  "Barbara",
  "Ken",
  "Radia",
  "Tim",
  "Hedy",
  "Katherine",
  "Claude",
  "Edsger",
  "Donald",
  "Frances",
  "José",
  "Zoë",
  "Søren",
  "Mei",
];
const LAST = [
  "Lovelace",
  "Hopper",
  "Turing",
  "Torvalds",
  "Hamilton",
  "Ritchie",
  "Liskov",
  "Thompson",
  "Perlman",
  "Berners-Lee",
  "Lamarr",
  "Johnson",
  "Shannon",
  "Dijkstra",
  "Knuth",
  "Allen",
  "García",
  "Müller",
  "Kierkegaard",
  "Chen",
];
const TITLES = ["Engineer", "Designer", "Manager", "Analyst", "Researcher"];

/** The first people are real; the rest make the directory large. */
export function makeDirectory(count) {
  const people = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
    const n = Math.floor(i / (FIRST.length * LAST.length));
    const slug = `${first}.${last}${n ? n : ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    people.push({
      id: `u${i}`,
      name: `${first} ${last}${n ? ` ${n}` : ""}`,
      email: `${slug}@example.com`,
      secondary: TITLES[i % TITLES.length],
    });
  }
  return people;
}

export const team = [
  {
    id: "g-design",
    type: "group",
    name: "Design",
    email: "design@example.com",
    memberCount: 3,
    members: [
      { id: "d1", name: "Mei Chen", email: "mei.chen@example.com" },
      { id: "d2", name: "Zoë Allen", email: "zoe.allen@example.com" },
      { id: "d3", name: "Søren Berg", email: "soren.berg@example.com" },
    ],
  },
  {
    id: "g-platform",
    type: "group",
    name: "Platform",
    memberCount: 2,
  },
  ...makeDirectory(8),
  {
    id: "u-off",
    name: "Out Of Office",
    email: "ooo@example.com",
    secondary: "Unavailable",
    disabled: true,
  },
];

export const arabic = [
  {
    id: "a1",
    name: "محمد علي",
    email: "mohamed@example.com",
    secondary: "مهندس",
  },
  {
    id: "a2",
    name: "فاطمة الزهراء",
    email: "fatima@example.com",
    secondary: "مصممة",
  },
  { id: "a3", name: "عمر بن الخطاب", email: "omar@example.com" },
  { id: "a4", name: "مُحَمَّد حسن", email: "hasan@example.com" },
];
