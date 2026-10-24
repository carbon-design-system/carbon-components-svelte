// @vitest-environment node
// @depends-on codemods/** tests/scripts/upgrade-0.114/** src/Theme/carbon-tokens.d.ts
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "svelte/compiler";
import { transform } from "../../codemods/v0.114/index.js";
import {
  COLOR_TOKENS,
  SPLIT_TOKENS,
  TYPE_STYLES,
} from "../../codemods/v0.114/maps.js";

const FIXTURES = fileURLToPath(new URL("./upgrade-0.114/", import.meta.url));
const CLI = fileURLToPath(new URL("../../codemods/cli.js", import.meta.url));
const CARBON_TOKENS = fileURLToPath(
  new URL("../../src/Theme/carbon-tokens.d.ts", import.meta.url),
);

const fixture = (file: string) =>
  readFileSync(path.join(FIXTURES, `${file}.txt`), "utf8");

/** Each fixture's notes as `line:column kind`. */
const CASES: {
  name: string;
  ext: string;
  output?: string;
  keepLayer03Color?: boolean;
  notes: string[];
}[] = [
  {
    name: "tokens",
    ext: "scss",
    notes: ["31:3 token", "32:3 token", "36:14 token", "38:23 token"],
  },
  {
    name: "script",
    ext: "ts",
    notes: ["8:28 token", "11:21 token", "12:45 token"],
  },
  {
    name: "theme",
    ext: "svelte",
    notes: ["7:5 token", "14:5 token", "23:8 theme"],
  },
  { name: "type-styles", ext: "svelte", notes: [] },
  { name: "light", ext: "svelte", notes: ["36:12 light"] },
  { name: "light-deep-import", ext: "svelte", notes: [] },
  { name: "light-namespace", ext: "svelte", notes: [] },
  { name: "light-layer-imported", ext: "svelte", notes: [] },
  { name: "light-layer-conflict", ext: "svelte", notes: [] },
  { name: "copy-input", ext: "svelte", notes: [] },
  {
    name: "date-picker",
    ext: "svelte",
    notes: [
      ...[36, 37, 38, 39, 40, 41, 42, 43, 44].map(
        (line) => `${line}:5 flatpickr`,
      ),
      "48:13 flatpickr",
    ],
  },
  {
    name: "layer-03",
    ext: "svelte",
    notes: ["7:6 layer-03", "8:6 layer-03", "9:17 layer-03", "9:34 layer-03"],
  },
  {
    name: "layer-03",
    ext: "svelte",
    output: "layer-03-keep",
    keepLayer03Color: true,
    notes: [],
  },
  { name: "page", ext: "svx", notes: [] },
  { name: "untouched", ext: "svelte", notes: [] },
];

describe("upgrade 0.114", () => {
  describe.each(CASES)(
    "$name.$ext",
    ({ name, ext, output = name, keepLayer03Color, notes }) => {
      const input = fixture(`${name}.input.${ext}`);
      const options = { filename: `${name}.${ext}`, parse, keepLayer03Color };
      const result = transform(input, options);

      it("rewrites the file", () => {
        const file = path.join(FIXTURES, `${output}.output.${ext}.txt`);
        const expected = existsSync(file) ? readFileSync(file, "utf8") : input;
        expect(result.code).toBe(expected);
      });

      it("reports what it leaves", () => {
        expect(
          result.notes.map(
            (note) => `${note.line}:${note.column} ${note.kind}`,
          ),
        ).toEqual(notes);
      });

      it("changes nothing on a second run", () => {
        expect(transform(result.code, options).code).toBe(result.code);
      });
    },
  );

  it("explains a split token and its candidates", () => {
    const { notes } = transform(":root { --cds-ui-03: #fff; }", {
      filename: "a.css",
    });
    expect(notes[0].message).toBe(
      "--cds-ui-03 was split in v11 into border-subtle-01 (borders), layer-accent-01 (fills). Set the ones you need",
    );
  });

  it("migrates CSS without a Svelte parser, and says markup was skipped", () => {
    const source = `<script>import { Tile } from "carbon-components-svelte";</script>\n<Tile light />\n<style>a { color: var(--cds-text-01); }</style>`;
    const { code, notes } = transform(source, { filename: "a.svelte" });
    expect(code).toContain("var(--cds-text-primary)");
    expect(code).toContain("<Tile light />");
    expect(notes.map((note) => note.kind)).toEqual(["parse"]);
  });
});

describe("upgrade 0.114 names", () => {
  const declared = new Set(
    [...readFileSync(CARBON_TOKENS, "utf8").matchAll(/"([a-z0-9-]+)"/g)].map(
      ([, name]) => name,
    ),
  );

  it("maps every v10 color token to a token all.css declares", () => {
    const targets = Object.values(COLOR_TOKENS).flatMap(Object.values);
    expect(targets.filter((target) => !declared.has(target))).toEqual([]);
  });

  it("never maps to a v10 name, so a second run is a no-op", () => {
    const v10 = new Set([
      ...Object.keys(COLOR_TOKENS),
      ...Object.keys(TYPE_STYLES),
    ]);
    const targets = [
      ...Object.values(COLOR_TOKENS).flatMap(Object.values),
      ...Object.values(TYPE_STYLES),
    ];
    expect(targets.filter((target) => v10.has(target))).toEqual([]);
  });

  it("lists split tokens that exist in the color map", () => {
    expect(
      Object.keys(SPLIT_TOKENS).filter((name) => !(name in COLOR_TOKENS)),
    ).toEqual([]);
  });
});

describe("carbon-components-svelte-upgrade", () => {
  const run = (cwd: string, ...args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    });

  let app = "";
  beforeEach(() => {
    app = mkdtempSync(path.join(tmpdir(), "ccs-upgrade-"));
    mkdirSync(path.join(app, "src", "node_modules"), { recursive: true });
    writeFileSync(
      path.join(app, "src", "App.svelte"),
      fixture("light-namespace.input.svelte"),
    );
    writeFileSync(
      path.join(app, "src", "app.css"),
      "a { color: var(--cds-text-01); }\n",
    );
    writeFileSync(
      path.join(app, "src", "node_modules", "skip.css"),
      "a { color: var(--cds-text-01); }\n",
    );
  });
  afterEach(() => rmSync(app, { recursive: true, force: true }));

  it("prints a diff and writes nothing by default", () => {
    const { status, stdout } = run(app, "0.114");
    expect(status).toBe(0);
    expect(stdout).toContain(
      '    5 - <Carbon.NumberInput light label="Count" />',
    );
    expect(stdout).toContain("    1 + a { color: var(--cds-text-primary); }");
    expect(stdout).toContain("2 files of 2 checked would change.");
    expect(readFileSync(path.join(app, "src", "app.css"), "utf8")).toContain(
      "--cds-text-01",
    );
  });

  it("writes with --write, then finds nothing to change", () => {
    expect(run(app, "0.114", "src", "--write").stdout).toContain(
      "Updated 2 files of 2 checked.",
    );
    expect(readFileSync(path.join(app, "src", "App.svelte"), "utf8")).toBe(
      fixture("light-namespace.output.svelte"),
    );
    expect(
      readFileSync(path.join(app, "src", "node_modules", "skip.css"), "utf8"),
    ).toContain("--cds-text-01");
    expect(run(app, "0.114", "src").stdout).toContain(
      "0 files of 2 checked would change.",
    );
  });

  it("lists manual follow-ups by kind", () => {
    writeFileSync(
      path.join(app, "src", "theme.css"),
      ":root { --cds-ui-03: #fff; }\n",
    );
    const { stdout } = run(app, "v0.114.0");
    expect(stdout).toContain("Manual follow-ups (1)");
    expect(stdout).toContain(
      "src/theme.css:1:9  --cds-ui-03 was split in v11 into",
    );
  });

  it("rejects an unknown version", () => {
    const { status, stderr } = run(app, "0.200");
    expect(status).toBe(1);
    expect(stderr).toContain("No codemod for 0.200. Available: 0.114.");
  });
});
