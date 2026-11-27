// @vitest-environment node
// @depends-on codemods/** tests/scripts/upgrade-0.114/** tests/scripts/upgrade-0.115/**
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../../codemods/cli.js", import.meta.url));
const FIXTURES = fileURLToPath(new URL("./upgrade-0.114/", import.meta.url));

const FIXTURES_0115 = fileURLToPath(
  new URL("./upgrade-0.115/", import.meta.url),
);

const fixture = (file: string) =>
  readFileSync(path.join(FIXTURES, `${file}.txt`), "utf8");
const fixture115 = (file: string) =>
  readFileSync(path.join(FIXTURES_0115, `${file}.txt`), "utf8");

describe("carbon-components-svelte-upgrade", () => {
  const run = (cwd: string, ...args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    });

  let app = "";
  const write = (file: string, text: string) => {
    mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
    writeFileSync(path.join(app, file), text);
  };
  const install = (version: string) =>
    write(
      "node_modules/carbon-components-svelte/package.json",
      JSON.stringify({ name: "carbon-components-svelte", version }),
    );

  beforeEach(() => {
    app = mkdtempSync(path.join(tmpdir(), "ccs-upgrade-"));
    write("src/App.svelte", fixture("light-namespace.input.svelte"));
    write("src/app.css", "a { color: var(--cds-text-01); }\n");
    write("src/node_modules/skip.css", "a { color: var(--cds-text-01); }\n");
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

  it("lists manual follow-ups by kind, then what no file shows", () => {
    write("src/theme.css", ":root { --cds-ui-03: #fff; }\n");
    const { stdout } = run(app, "v0.114.0");
    expect(stdout).toContain("Manual follow-ups (1)");
    expect(stdout).toContain(
      "src/theme.css:1:9  --cds-ui-03 was split in v11 into",
    );
    expect(stdout).toContain("Also in 0.114\n  Safari 14.1 is the minimum.");
  });

  it("rejects an unknown version", () => {
    const { status, stderr } = run(app, "0.200");
    expect(status).toBe(1);
    expect(stderr).toMatch(/^No codemod for 0\.200\. Available: 0\.114/);
  });

  it("runs the codemods after the installed version", () => {
    install("0.113.4");
    const { stdout } = run(app);
    expect(stdout).toMatch(/^Upgrading from 0\.113\.4 \(installed\): 0\.114/);
    expect(stdout).toContain("2 files of 2 checked would change.");
  });

  it("chains each release's codemod on the one before's output", () => {
    install("0.113.4");
    write(
      "src/Shell.svelte",
      '<script>\n  import { Theme } from "carbon-components-svelte";\n</script>\n\n<Theme render="toggle" tokens={{ "ui-01": "#fff" }} />\n',
    );
    const { stdout } = run(app, "src/Shell.svelte", "--write");
    expect(stdout).toMatch(
      /^Upgrading from 0\.113\.4 \(installed\): 0\.114, 0\.115\./,
    );
    expect(stdout).toContain("Also in 0.115\n  Chrome and Edge 105");
    expect(readFileSync(path.join(app, "src", "Shell.svelte"), "utf8")).toBe(
      `<script>
  import { Theme, ThemeToggle } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/src/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme tokens={{ "layer-01": "#fff" }} />
<ThemeToggle bind:theme />
`,
    );
  });

  it("starts after the installed minor", () => {
    install("0.114.3");
    write("src/Search.svelte", fixture115("search-menu.input.svelte"));
    const { stdout } = run(app, "src/Search.svelte", "--keep-sizes");
    expect(stdout).toMatch(/^Upgrading from 0\.114\.3 \(installed\): 0\.115\./);
    expect(stdout).toContain(
      '    8 + <SearchMenu size="xl" labelText="Search"',
    );
  });

  it("reads the version package.json names when nothing is installed", () => {
    write(
      "package.json",
      JSON.stringify({
        dependencies: { "carbon-components-svelte": "^0.113.0" },
      }),
    );
    expect(run(app).stdout).toMatch(
      /^Upgrading from \^0\.113\.0 \(package\.json\): 0\.114/,
    );
  });

  it("runs the codemods after --from", () => {
    install("0.200.0");
    expect(run(app, "--from", "0.113").stdout).toMatch(
      /^Upgrading from 0\.113: 0\.114/,
    );
    const { status, stderr } = run(app, "--from", "0.200");
    expect(status).toBe(1);
    expect(stderr).toContain("No codemod after 0.200.");
  });

  it("runs the latest codemod when the app is already on it", () => {
    install("0.200.0");
    const { stdout } = run(app);
    expect(stdout).toMatch(/^Running the 0\.\d+ codemod\. Upgrading from an/);
  });
});
