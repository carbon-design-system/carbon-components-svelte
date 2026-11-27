/**
 * Where the regions with no flag yet stand, by what drawing each needs.
 * `bun run build:flags --coverage` and tests/scripts/flags.test.ts check that
 * every region is drawn or listed here exactly once.
 *
 * This is a judgement made by reading each flag, not a measurement: "param"
 * means the layers in scripts/lib/flags.ts should draw it, and the flags
 * drawn so far show they do for the same families.
 */
const WHITESPACE = /\s+/;
const list = (codes: string) => codes.trim().split(WHITESPACE);

/** Stripes, crosses, triangles, discs, stars, cantons or rays: no emblem. */
export const PARAMETRIC = list(`
  CG CF TG KM SC MW NA LR BI RW SS KP KG MV MY NP PH TL UZ SY GE BA MK MT AG
  GD GY KN LC SR UY VC VE FM MH NR SB TV NU CK WF CV ST GW MR TN AX FO GL GG
  CW AW IQ
`);

/**
 * Flags a sovereign state's flag stands for, by law or by use: Svalbard flies
 * Norway's, a French overseas department France's.
 */
export const ALIAS: Record<string, string> = {
  SJ: "NO",
  BV: "NO",
  HM: "AU",
  UM: "US",
  BQ: "NL",
  GP: "FR",
  MQ: "FR",
  GF: "FR",
  RE: "FR",
  YT: "FR",
  BL: "FR",
  MF: "FR",
  PM: "FR",
  TF: "FR",
};

/** A coat of arms or an emblem that needs a hand-simplified shape. */
export const EMBLEM = list(`
  AD AF AL AO AS BB BN BT BY BZ CC CX CY DM EC ER GQ GT GU HR HT IR KH KI KZ
  LB LI LK LS MD ME MN MP MZ NC NF NI OM PF PG PN PY RS SI SK SM SV SZ TJ TK
  TM UG VA VU ZM ZW AI BM FK FJ GI IM IO JE KY MS SX TC VG VI GS SH
`);

/**
 * No flag until the maintainers decide: a status in dispute, or no flag of
 * its own. These get the code badge.
 */
export const HELD = list("AQ CQ EH HK MO PS TW XK");
