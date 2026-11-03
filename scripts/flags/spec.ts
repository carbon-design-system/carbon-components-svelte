/**
 * The flag specs: one short list of layers per ISO 3166-1 code. See
 * scripts/lib/flags.ts for what each layer means, and the Flag docs page for
 * the rules these follow (uniform 4:3 frame, Carbon-derived palette, flat
 * fills, nothing that falls under about 1 px at 16 px).
 *
 * Positions are fractions of the box, sizes of discs and stars are fractions
 * of its height, and a width is in grid units of the 32 x 24 frame.
 */
import type { FlagSpec, Point } from "../lib/flags";

const W = 32;
const H = 24;

/** The angle (clockwise from up) that points a star at a target, in grid units. */
const toward = (from: Point, to: Point): number =>
  (Math.atan2((to[0] - from[0]) * W, -(to[1] - from[1]) * H) * 180) / Math.PI;

/** Mirror the right half of an outline around the vertical axis (x = 0). */
const symmetric = (right: readonly Point[]): Point[] => [
  ...right,
  ...right
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Point => [-x, y]),
];

/** A hoist-side Nordic cross: field, then the cross, then any inner cross. */
const nordic = (
  field: "red" | "blue" | "white",
  cx: number,
  ...crosses: Array<
    readonly ["white" | "red" | "blue" | "navy" | "yellow", number]
  >
): FlagSpec => [
  ["fill", field],
  ...crosses.map(([color, thick]) => ["cross", color, thick, cx] as const),
];

// Five-star arc and similar share this: a star that points at the hoist.
const smallStar = (
  at: Point,
  big: Point,
): readonly ["star", "yellow", number, number, number, number, number] => [
  "star",
  "yellow",
  at[0],
  at[1],
  0.05,
  5,
  toward(at, big),
];

/** A symmetric outline from its right half, placed and sized in the box. */
const place = (
  right: readonly Point[],
  cx: number,
  cy: number,
  size: number,
): Point[] =>
  symmetric(right).map(([x, y]): Point => [
    cx + x * size * (H / W),
    cy + y * size,
  ]);

const MAPLE_LEAF: readonly Point[] = [
  [0, -1],
  [0.12, -0.62],
  [0.3, -0.7],
  [0.28, -0.3],
  [0.58, -0.5],
  [0.52, -0.18],
  [0.92, -0.1],
  [0.74, 0.18],
  [0.84, 0.44],
  [0.4, 0.36],
  [0.09, 0.62],
  [0.06, 1],
  [0, 1],
];

/** A white band with a saw-toothed fly edge, as on the Qatari flag. */
const serrated = (edge: number, depth: number, teeth: number): Point[] => [
  [0, 0],
  [edge, 0],
  ...Array.from({ length: teeth }, (_, i): Point[] => [
    [edge + depth, (i + 0.5) / teeth],
    [edge, (i + 1) / teeth],
  ]).flat(),
  [0, 1],
];

const CHINA_BIG: Point = [0.167, 0.25];

export const UNION_JACK: FlagSpec = [
  ["fill", "navy"],
  ["saltire", "white", 5],
  ["saltire", "red", 2],
  ["cross", "white", 8],
  ["cross", "red", 5],
];

const SOUTHERN_CROSS = (red: boolean): FlagSpec => {
  const stars: Array<readonly [number, number, number]> = red
    ? [
        [0.75, 0.18, 0.075],
        [0.75, 0.82, 0.075],
        [0.64, 0.5, 0.075],
        [0.86, 0.4, 0.075],
      ]
    : [
        [0.75, 0.14, 0.085],
        [0.75, 0.85, 0.085],
        [0.62, 0.47, 0.085],
        [0.88, 0.37, 0.085],
        [0.82, 0.62, 0.05],
      ];
  return stars.flatMap(([x, y, r]): FlagSpec =>
    red
      ? [
          ["star", "white", x, y, r + 0.025, 5] as const,
          ["star", "red", x, y, r, 5] as const,
        ]
      : [["star", "white", x, y, r, 7, 0, 0.45] as const],
  );
};

export const SPEC: Record<string, FlagSpec> = {
  // Emblems, simplified. Each keeps the real emblem's colors and mass and
  // drops text, small charges and shading.
  CA: [
    ["v", "red", ["white", 2], "red"],
    ["poly", "red", place(MAPLE_LEAF, 0.5, 0.5, 0.38)],
  ],
  BR: [
    ["fill", "green"],
    [
      "poly",
      "yellow",
      [
        [0.5, 0.1],
        [0.92, 0.5],
        [0.5, 0.9],
        [0.08, 0.5],
      ],
    ],
    ["disc", "navy", 0.5, 0.5, 0.27],
    ["path", "white", "M9.9 11.6Q16.2 16.4 22 10.6V12.5Q16.2 18.2 9.9 13.4z"],
  ],
  SA: [
    ["fill", "green"],
    ["rect", "white", 0.19, 0.27, 0.62, 0.13],
    [
      "poly",
      "white",
      [
        [0.19, 0.625],
        [0.3, 0.585],
        [0.79, 0.585],
        [0.79, 0.665],
        [0.3, 0.665],
      ],
    ],
    ["rect", "white", 0.78, 0.53, 0.035, 0.2],
    ["rect", "white", 0.815, 0.6, 0.07, 0.065],
  ],
  ZA: [
    ["h", "red", "blue"],
    [
      "poly",
      "white",
      [
        [0, 0],
        [0.16, 0],
        [0.46, 0.37],
        [1, 0.37],
        [1, 0.63],
        [0.46, 0.63],
        [0.16, 1],
        [0, 1],
      ],
    ],
    [
      "poly",
      "green",
      [
        [0, 0],
        [0.1, 0],
        [0.43, 0.405],
        [1, 0.405],
        [1, 0.595],
        [0.43, 0.595],
        [0.1, 1],
        [0, 1],
      ],
    ],
    [
      "poly",
      "yellow",
      [
        [0, 0.1],
        [0.37, 0.5],
        [0, 0.9],
      ],
    ],
    [
      "poly",
      "black",
      [
        [0, 0.2],
        [0.28, 0.5],
        [0, 0.8],
      ],
    ],
  ],
  PT: [
    ["v", ["green", 2], ["red", 3]],
    ["ring", "yellow", 0.4, 0.5, 0.23, 1.5],
    [
      "poly",
      "white",
      [
        [0.335, 0.39],
        [0.465, 0.39],
        [0.465, 0.53],
        [0.4, 0.63],
        [0.335, 0.53],
      ],
    ],
    [
      "poly",
      "red",
      [
        [0.358, 0.42],
        [0.442, 0.42],
        [0.442, 0.52],
        [0.4, 0.58],
        [0.358, 0.52],
      ],
    ],
  ],
  ES: [
    ["h", "red", ["yellow", 2], "red"],
    ["rect", "red", 0.27, 0.36, 0.025, 0.28],
    ["rect", "red", 0.455, 0.36, 0.025, 0.28],
    [
      "poly",
      "red",
      [
        [0.31, 0.38],
        [0.44, 0.38],
        [0.44, 0.52],
        [0.375, 0.63],
        [0.31, 0.52],
      ],
    ],
  ],
  KE: [
    [
      "h",
      ["black", 6],
      ["white", 1.4],
      ["red", 7],
      ["white", 1.4],
      ["green", 6],
    ],
    [
      "poly",
      "white",
      [
        [0.28, 0.12],
        [0.31, 0.12],
        [0.73, 0.88],
        [0.7, 0.88],
      ],
    ],
    [
      "poly",
      "white",
      [
        [0.69, 0.12],
        [0.72, 0.12],
        [0.3, 0.88],
        [0.27, 0.88],
      ],
    ],
    ["oval", "white", 0.5, 0.5, 0.24, 0.35],
    ["oval", "black", 0.5, 0.5, 0.2, 0.31],
    ["oval", "red", 0.5, 0.5, 0.1, 0.2],
  ],
  EG: [
    ["h", "red", "white", "black"],
    [
      "poly",
      "yellow",
      place(
        [
          [0, -0.4],
          [0.2, -0.22],
          [0.85, -0.3],
          [0.95, 0.35],
          [0.55, 0.1],
          [0.58, 0.5],
          [0.22, 0.52],
          [0.15, 0.95],
          [0, 1],
        ],
        0.5,
        0.5,
        0.26,
      ),
    ],
  ],

  // Africa, the Americas and the Pacific: more bands, stars and cantons.
  AM: [["h", "red", "royal", "orange"]],
  AZ: [
    ["h", "sky", "red", "green"],
    ["crescent", "white", 0.47, 0.5, 0.1, 0.25, 0.8],
    ["star", "white", 0.57, 0.5, 0.05, 8, 0, 0.5],
  ],
  TH: [["h", "red", "white", ["navy", 2], "white", "red"]],
  MM: [
    ["h", "yellow", "green", "red"],
    ["star", "white", 0.5, 0.5, 0.33],
  ],
  QA: [
    ["fill", "maroon"],
    ["poly", "white", serrated(0.28, 0.08, 9)],
  ],
  BH: [
    ["fill", "red"],
    ["poly", "white", serrated(0.28, 0.08, 5)],
  ],
  MA: [
    ["fill", "red"],
    ["star", "green", 0.5, 0.5, 0.24],
    ["star", "red", 0.5, 0.5, 0.17],
  ],
  DZ: [
    ["v", "green", "white"],
    ["crescent", "red", 0.5, 0.5, 0.24, 0.25, 0.8],
    ["star", "red", 0.58, 0.5, 0.1, 5, 90],
  ],
  GH: [
    ["h", "red", "yellow", "green"],
    ["star", "black", 0.5, 0.5, 0.22],
  ],
  SN: [
    ["v", "green", "yellow", "red"],
    ["star", "green", 0.5, 0.5, 0.17],
  ],
  CM: [
    ["v", "green", "red", "yellow"],
    ["star", "yellow", 0.5, 0.5, 0.17],
  ],
  ET: [
    ["h", "green", "yellow", "red"],
    ["disc", "royal", 0.5, 0.5, 0.27],
    ["star", "yellow", 0.5, 0.5, 0.2],
  ],
  BW: [["h", ["sky", 9], "white", ["black", 4], "white", ["sky", 9]]],
  LY: [
    ["h", "red", ["black", 2], "green"],
    ["crescent", "white", 0.47, 0.5, 0.15, 0.25, 0.8],
    ["star", "white", 0.56, 0.5, 0.06, 5, 90],
  ],
  SO: [
    ["fill", "sky"],
    ["star", "white", 0.5, 0.5, 0.3],
  ],
  DJ: [
    ["h", "sky", "green"],
    [
      "poly",
      "white",
      [
        [0, 0],
        [0.5, 0.5],
        [0, 1],
      ],
    ],
    ["star", "red", 0.14, 0.5, 0.1, 5, 90],
  ],
  CD: [
    ["fill", "sky"],
    ["saltire", "yellow", 9, "/"],
    ["saltire", "red", 6, "/"],
    ["star", "yellow", 0.14, 0.22, 0.12],
  ],
  MG: [
    ["rect", "white", 0, 0, 0.333, 1],
    ["rect", "red", 0.333, 0, 0.667, 0.5],
    ["rect", "green", 0.333, 0.5, 0.667, 0.5],
  ],
  BF: [
    ["h", "red", "green"],
    ["star", "yellow", 0.5, 0.5, 0.2],
  ],
  BJ: [
    ["rect", "green", 0, 0, 0.4, 1],
    ["rect", "yellow", 0.4, 0, 0.6, 0.5],
    ["rect", "red", 0.4, 0.5, 0.6, 0.5],
  ],
  NE: [
    ["h", "orange", "white", "green"],
    ["disc", "orange", 0.5, 0.5, 0.1],
  ],
  GA: [["h", "green", "yellow", "blue"]],
  GM: [["h", ["red", 6], "white", ["blue", 4], "white", ["green", 6]]],
  SL: [["h", "green", "white", "blue"]],
  MU: [["h", "red", "blue", "yellow", "green"]],
  TZ: [
    ["fill", "green"],
    [
      "poly",
      "blue",
      [
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    ],
    ["saltire", "yellow", 9, "/"],
    ["saltire", "black", 6, "/"],
  ],
  DO: [
    ["fill", "navy"],
    ["rect", "red", 0.5, 0, 0.5, 0.5],
    ["rect", "red", 0, 0.5, 0.5, 0.5],
    ["cross", "white", 4.5],
  ],
  CR: [["h", "royal", "white", ["red", 2], "white", "royal"]],
  PA: [
    ["fill", "white"],
    ["rect", "red", 0.5, 0, 0.5, 0.5],
    ["rect", "blue", 0, 0.5, 0.5, 0.5],
    ["star", "blue", 0.25, 0.25, 0.14],
    ["star", "red", 0.75, 0.75, 0.14],
  ],
  HN: [
    ["h", "blue", "white", "blue"],
    ["star", "blue", 0.5, 0.5, 0.07],
    ["star", "blue", 0.4, 0.44, 0.07],
    ["star", "blue", 0.6, 0.44, 0.07],
    ["star", "blue", 0.4, 0.56, 0.07],
    ["star", "blue", 0.6, 0.56, 0.07],
  ],
  BS: [
    ["h", "sky", "yellow", "sky"],
    [
      "poly",
      "black",
      [
        [0, 0],
        [0.42, 0.5],
        [0, 1],
      ],
    ],
  ],
  TT: [
    ["fill", "red"],
    ["saltire", "white", 10, "\\"],
    ["saltire", "black", 6.5, "\\"],
  ],
  WS: [
    ["fill", "red"],
    [
      "canton",
      0.5,
      0.5,
      [
        ["fill", "royal"],
        ["star", "white", 0.5, 0.2, 0.11],
        ["star", "white", 0.5, 0.8, 0.11],
        ["star", "white", 0.28, 0.5, 0.11],
        ["star", "white", 0.72, 0.42, 0.11],
        ["star", "white", 0.62, 0.64, 0.06],
      ],
    ],
  ],
  TO: [
    ["fill", "red"],
    [
      "canton",
      0.5,
      0.5,
      [
        ["fill", "white"],
        ["cross", "red", 7],
      ],
    ],
  ],

  // Horizontal and vertical bands.
  DE: [["h", "black", "red", "yellow"]],
  NL: [["h", "red", "white", "blue"]],
  LU: [["h", "red", "white", "sky"]],
  AT: [["h", "red", "white", "red"]],
  HU: [["h", "red", "white", "green"]],
  BG: [["h", "white", "green", "red"]],
  LT: [["h", "yellow", "green", "red"]],
  LV: [["h", ["maroon", 2], "white", ["maroon", 2]]],
  EE: [["h", "blue", "black", "white"]],
  PL: [["h", "white", "red"]],
  UA: [["h", "blue", "yellow"]],
  RU: [["h", "white", "royal", "red"]],
  MC: [["h", "red", "white"]],
  ID: [["h", "red", "white"]],
  YE: [["h", "red", "white", "black"]],
  CO: [["h", ["yellow", 2], "royal", "red"]],
  BO: [["h", "red", "yellow", "green"]],
  FR: [["v", "blue", "white", "red"]],
  IT: [["v", "green", "white", "red"]],
  IE: [["v", "green", "white", "orange"]],
  BE: [["v", "black", "yellow", "red"]],
  RO: [["v", "royal", "yellow", "red"]],
  NG: [["v", "green", "white", "green"]],
  TD: [["v", "royal", "yellow", "red"]],
  ML: [["v", "green", "yellow", "red"]],
  GN: [["v", "red", "yellow", "green"]],
  CI: [["v", "orange", "white", "green"]],
  PE: [["v", "red", "white", "red"]],
  MX: [
    ["v", "green", "white", "red"],
    ["ring", "forest", 0.5, 0.5, 0.17, 1.4],
    ["disc", "maroon", 0.5, 0.52, 0.085],
  ],

  // Discs.
  JP: [
    ["fill", "white"],
    ["disc", "red", 0.5, 0.5, 0.3],
  ],
  BD: [
    ["fill", "green"],
    ["disc", "red", 0.45, 0.5, 0.267],
  ],
  PW: [
    ["fill", "sky"],
    ["disc", "yellow", 0.42, 0.5, 0.3],
  ],
  LA: [
    ["h", ["red", 1], ["blue", 2], ["red", 1]],
    ["disc", "white", 0.5, 0.5, 0.17],
  ],

  // Nordic crosses.
  SE: nordic("blue", 0.375, ["yellow", 5]),
  NO: nordic("red", 0.364, ["white", 6], ["navy", 3]),
  DK: nordic("red", 0.378, ["white", 4.5]),
  FI: nordic("white", 0.361, ["blue", 6]),
  IS: nordic("blue", 0.36, ["white", 6], ["red", 3]),

  // Crosses and saltires.
  CH: [
    ["fill", "red"],
    ["rect", "white", 0.21875, 0.3958, 0.5625, 0.2083],
    ["rect", "white", 0.421875, 0.1667, 0.15625, 0.6667],
  ],
  GB: UNION_JACK,
  JM: [
    ["fill", "green"],
    [
      "poly",
      "black",
      [
        [0, 0],
        [0.5, 0.5],
        [0, 1],
      ],
    ],
    [
      "poly",
      "black",
      [
        [1, 0],
        [0.5, 0.5],
        [1, 1],
      ],
    ],
    ["saltire", "yellow", 4.5],
  ],
  GR: [
    ["h", "blue", "white", "blue", "white", "blue"],
    [
      "canton",
      0.45,
      0.6,
      [
        ["fill", "blue"],
        ["cross", "white", 3],
      ],
    ],
  ],

  // Cantons.
  US: [
    ["h", "red", "white", "red", "white", "red", "white", "red"],
    [
      "canton",
      0.4,
      4 / 7,
      [
        ["fill", "navy"],
        ...[0.2, 0.5, 0.8].flatMap((y) =>
          [0.22, 0.5, 0.78].map((x) => ["star", "white", x, y, 0.12] as const),
        ),
      ],
    ],
  ],
  AU: [
    ["fill", "navy"],
    ["canton", 0.5, 0.5, [["ref", "GB"]]],
    ["star", "white", 0.25, 0.75, 0.17, 7, 0, 0.45],
    ...SOUTHERN_CROSS(false),
  ],
  NZ: [
    ["fill", "navy"],
    ["canton", 0.5, 0.5, [["ref", "GB"]]],
    ...SOUTHERN_CROSS(true),
  ],
  CL: [
    ["h", "white", "red"],
    [
      "canton",
      1 / 3,
      0.5,
      [
        ["fill", "royal"],
        ["star", "white", 0.5, 0.5, 0.3],
      ],
    ],
  ],
  CU: [
    ["h", "royal", "white", "royal", "white", "royal"],
    [
      "poly",
      "red",
      [
        [0, 0],
        [0.42, 0.5],
        [0, 1],
      ],
    ],
    ["star", "white", 0.14, 0.5, 0.12],
  ],
  PR: [
    ["h", "red", "white", "red", "white", "red"],
    [
      "poly",
      "royal",
      [
        [0, 0],
        [0.42, 0.5],
        [0, 1],
      ],
    ],
    ["star", "white", 0.14, 0.5, 0.12],
  ],

  // Triangles.
  CZ: [
    ["h", "white", "red"],
    [
      "poly",
      "blue",
      [
        [0, 0],
        [0.5, 0.5],
        [0, 1],
      ],
    ],
  ],
  JO: [
    ["h", "black", "white", "green"],
    [
      "poly",
      "red",
      [
        [0, 0],
        [0.5, 0.5],
        [0, 1],
      ],
    ],
    ["star", "white", 0.17, 0.5, 0.1, 7, 0, 0.45],
  ],
  SD: [
    ["h", "red", "white", "black"],
    [
      "poly",
      "green",
      [
        [0, 0],
        [0.4, 0.5],
        [0, 1],
      ],
    ],
  ],
  KW: [
    ["h", "green", "white", "red"],
    [
      "poly",
      "black",
      [
        [0, 0],
        [0.25, 0.333],
        [0.25, 0.667],
        [0, 1],
      ],
    ],
  ],
  AE: [
    ["h", "green", "white", "black"],
    ["rect", "red", 0, 0, 0.25, 1],
  ],

  // Stars and crescents.
  VN: [
    ["fill", "red"],
    ["star", "yellow", 0.5, 0.5, 0.31],
  ],
  CN: [
    ["fill", "red"],
    ["star", "yellow", CHINA_BIG[0], CHINA_BIG[1], 0.15],
    smallStar([0.333, 0.1], CHINA_BIG),
    smallStar([0.4, 0.2], CHINA_BIG),
    smallStar([0.4, 0.35], CHINA_BIG),
    smallStar([0.333, 0.45], CHINA_BIG),
  ],
  TR: [
    ["fill", "red"],
    ["crescent", "white", 0.375, 0.5, 0.25, 0.25, 0.8],
    ["star", "white", 0.58, 0.5, 0.11, 5, 90],
  ],
  PK: [
    ["fill", "green"],
    ["rect", "white", 0, 0, 0.25, 1],
    ["crescent", "white", 0.58, 0.52, 0.22, 0.3, 0.8],
    ["star", "white", 0.78, 0.36, 0.075, 5, 45],
  ],
  SG: [
    ["h", "red", "white"],
    ["crescent", "white", 0.19, 0.25, 0.17, 0.25, 0.8],
    ["star", "white", 0.34, 0.25, 0.04],
  ],
  IL: [
    ["fill", "white"],
    ["rect", "royal", 0, 0.094, 1, 0.14],
    ["rect", "royal", 0, 0.766, 1, 0.14],
    ["star", "royal", 0.5, 0.5, 0.27, 6],
    ["star", "white", 0.5, 0.5, 0.2, 6],
  ],
  IN: [
    ["h", "orange", "white", "green"],
    ["wheel", "navy", 0.5, 0.5, 0.12, 1, 6],
  ],
  AR: [
    ["h", "sky", "white", "sky"],
    ["star", "yellow", 0.5, 0.5, 0.15, 16, 0, 0.55],
  ],
  KR: [
    ["fill", "white"],
    ["yinyang", "red", "blue", 0.5, 0.5, 0.25, -33.69],
    ["trigram", "black", 0.2, 0.2, 56, "111"],
    ["trigram", "black", 0.8, 0.8, 56, "000"],
    ["trigram", "black", 0.8, 0.2, -56, "010"],
    ["trigram", "black", 0.2, 0.8, -56, "101"],
  ],
};
