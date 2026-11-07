export type Sale = {
  id: number;
  region: string;
  country: string;
  product: string;
  channel: string;
  year: number;
  quarter: string;
  amount: number;
  units: number;
};

const REGIONS: Record<string, string[]> = {
  Americas: ["Brazil", "Canada", "United States"],
  Asia: ["India", "Japan", "Singapore"],
  Europe: ["France", "Germany", "Spain"],
};
const PRODUCTS = ["Analytics", "Automation", "Security", "Storage"];
const CHANNELS = ["Direct", "Partner"];

/** A deterministic sample of sales, so screenshots and assertions repeat. */
export function makeSales(count: number): Sale[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const regions = Object.keys(REGIONS);
  return Array.from({ length: count }, (_, id) => {
    const region = regions[Math.floor(next() * regions.length)];
    const countries = REGIONS[region];
    return {
      id,
      region,
      country: countries[Math.floor(next() * countries.length)],
      product: PRODUCTS[Math.floor(next() * PRODUCTS.length)],
      channel: CHANNELS[Math.floor(next() * CHANNELS.length)],
      year: 2023 + Math.floor(next() * 3),
      quarter: `Q${1 + Math.floor(next() * 4)}`,
      amount: Math.round(next() * 9000) + 100,
      units: 1 + Math.floor(next() * 20),
    };
  });
}

/** Records with a few groups, many sub-groups, and a column per week. */
export function makeWide(
  count: number,
  groups = 50,
): Record<string, unknown>[] {
  let seed = 11;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  return Array.from({ length: count }, (_, id) => ({
    id,
    team: `Team ${1 + Math.floor(next() * 6)}`,
    owner: `Owner ${1 + Math.floor(next() * 4)}`,
    group: `Group ${String(1 + Math.floor(next() * groups)).padStart(2, "0")}`,
    kind: ["Plan", "Actual"][Math.floor(next() * 2)],
    hours: Math.round(next() * 400) / 10,
  }));
}
