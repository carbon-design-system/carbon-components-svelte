import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const GITHUB_REPO_RE = /github\.com[:/]([^/]+)\/([^/.]+)/;
const CONVENTIONAL_HEADER_RE = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/;
const BREAKING_CHANGE_FOOTER_RE =
  /BREAKING CHANGE:\s*([\s\S]+?)(?:\n\n(?!\s)|$)/i;
const BLANK_PARAGRAPH_RE = /\n{2,}/;
const CLOSES_FIXES_RE = /(?:closes|fixes)\s+#(\d+)/gi;
const PKG_VERSION_RE = /("version":\s*)"\d+\.\d+\.\d+"/;

type ParsedCommit = {
  hash: string;
  subject: string;
  type: string;
  scope: string | undefined;
  description: string;
  breaking: boolean;
  breakingFromBang: boolean;
  breakingText: string;
  body: string;
};

function repoBaseUrl(repositoryUrl: string): string {
  const m = repositoryUrl.match(GITHUB_REPO_RE);
  if (!m) throw new Error("Could not parse GitHub URL from repository.url");
  return `https://github.com/${m[1]}/${m[2]}`;
}

function parseConventional(
  hash: string,
  subject: string,
  body: string,
): ParsedCommit | null {
  if (subject.startsWith("Merge ")) return null;

  const m = subject.match(CONVENTIONAL_HEADER_RE);
  if (!m) return null;

  const [, type, scope, bang, description] = m;
  const breakingFromBang = bang === "!";
  const breakingChangeMatch = body.match(BREAKING_CHANGE_FOOTER_RE);
  const breaking = breakingFromBang || Boolean(breakingChangeMatch);
  let breakingText = description.trim();
  if (breakingChangeMatch) {
    breakingText = breakingChangeMatch[1]
      .trim()
      .split(BLANK_PARAGRAPH_RE)[0]
      .trim();
  }

  return {
    hash,
    subject,
    type,
    scope: scope || undefined,
    description: description.trim(),
    breaking,
    breakingFromBang,
    breakingText,
    body,
  };
}

function isReleasable(c: ParsedCommit): boolean {
  if (c.breaking) return true;
  return c.type === "feat" || c.type === "fix" || c.type === "perf";
}

function closesFromBody(body: string): string[] {
  const ids = new Set<string>();
  for (const m of body.matchAll(CLOSES_FIXES_RE)) {
    ids.add(m[1]);
  }
  return [...ids];
}

function formatBullet(
  baseUrl: string,
  c: ParsedCommit,
  text: string,
  issueIds: string[],
): string {
  const short = c.hash.slice(0, 7);
  const commitUrl = `${baseUrl}/commit/${c.hash}`;
  let line = c.scope
    ? `- **${c.scope}:** ${text} ([${short}](${commitUrl}))`
    : `- ${text} ([${short}](${commitUrl}))`;

  if (issueIds.length > 0) {
    const issuesBase = `${baseUrl}/issues`;
    const closes = issueIds
      .map((id) => `[#${id}](${issuesBase}/${id})`)
      .join(" ");
    line += `, closes ${closes}`;
  }

  return line;
}

function bumpVersion(current: string, minor: boolean): string {
  const parts = current.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid package.json version: ${current}`);
  }
  const [maj, min, pat] = parts;
  if (minor) return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

async function git(...args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  if (code !== 0) throw new Error(err || `git ${args.join(" ")} failed`);
  return out.trimEnd();
}

function splitLog(
  output: string,
): { hash: string; subject: string; body: string }[] {
  const sep = "\x1e";
  const raw = output.endsWith(sep) ? output : `${output}${sep}`;
  const blocks = raw.split(sep).filter((b) => b.length > 0);
  const commits: { hash: string; subject: string; body: string }[] = [];
  const rs = "\x0f";
  for (const block of blocks) {
    const parts = block.split(rs);
    const hash = parts[0]?.trim();
    const subject = parts[1]?.trim() ?? "";
    const body = parts.slice(2).join(rs).trim();
    if (hash?.length === 40) {
      commits.push({ hash, subject, body });
    }
  }
  return commits;
}

const pkgPath = path.join(root, "package.json");
const changelogPath = path.join(root, "CHANGELOG.md");

const pkgRaw = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgRaw) as {
  version: string;
  repository: { url: string };
};
const baseUrl = repoBaseUrl(pkg.repository.url);
const currentVersion = pkg.version;

const lastTag = await git("describe", "--tags", "--abbrev=0");
const logOut = await git(
  "log",
  `${lastTag}..HEAD`,
  "--no-merges",
  "--pretty=format:%H%x0f%s%x0f%b%x1e",
);

const rawCommits = splitLog(logOut);
const parsed = rawCommits
  .map(({ hash, subject, body }) => parseConventional(hash, subject, body))
  .filter((c): c is ParsedCommit => c !== null);

const releasable = parsed.filter(isReleasable);
if (releasable.length === 0) {
  console.error(
    "release-changelog: No releasable commits since",
    lastTag,
    "(need feat, fix, perf, or breaking changes).",
  );
  process.exit(1);
}

const hasMinorBump = releasable.some((c) => c.type === "feat" || c.breaking);
const nextVersion = bumpVersion(currentVersion, hasMinorBump);

const breakingLines: string[] = [];
const featureLines: string[] = [];
const fixLines: string[] = [];
const perfLines: string[] = [];

for (const c of releasable) {
  const issueIds = closesFromBody(`${c.body}\n${c.subject}`);

  if (c.breaking) {
    breakingLines.push(formatBullet(baseUrl, c, c.breakingText, issueIds));
  }

  if (c.type === "feat" && !c.breakingFromBang) {
    featureLines.push(formatBullet(baseUrl, c, c.description, issueIds));
  }

  if (c.type === "fix") {
    fixLines.push(formatBullet(baseUrl, c, c.description, issueIds));
  }

  if (c.type === "perf") {
    perfLines.push(formatBullet(baseUrl, c, c.description, issueIds));
  }
}

function compareBulletLines(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

breakingLines.sort(compareBulletLines);
featureLines.sort(compareBulletLines);
fixLines.sort(compareBulletLines);
perfLines.sort(compareBulletLines);

const sections: string[] = [];
if (breakingLines.length) {
  sections.push("### ⚠ BREAKING CHANGES", "", ...breakingLines, "");
}
if (featureLines.length) {
  sections.push("### Features", "", ...featureLines, "");
}
if (fixLines.length) {
  sections.push("### Bug Fixes", "", ...fixLines, "");
}
if (perfLines.length) {
  sections.push("### Performance", "", ...perfLines, "");
}

const compareUrl = `${baseUrl}/compare/v${currentVersion}...v${nextVersion}`;
const header = `### [${nextVersion}](${compareUrl}) (${todayIso()})`;
const newBlock = [header, "", sections.join("\n").trimEnd()].join("\n");

if (dryRun) {
  console.log(
    "Next version:",
    nextVersion,
    hasMinorBump ? "(minor)" : "(patch)",
  );
  console.log("---");
  console.log(newBlock);
  process.exit(0);
}

if (!PKG_VERSION_RE.test(pkgRaw)) {
  throw new Error("Could not find version field in package.json");
}
fs.writeFileSync(
  pkgPath,
  pkgRaw.replace(PKG_VERSION_RE, `$1"${nextVersion}"`),
  "utf8",
);

const changelog = fs.readFileSync(changelogPath, "utf8");
const marker = "\n\n### [";
const idx = changelog.indexOf(marker);
if (idx === -1) {
  throw new Error("CHANGELOG.md: could not find insertion point after intro");
}
const updated = `${changelog.slice(0, idx)}\n\n${newBlock}\n\n${changelog.slice(idx + 2)}`;

fs.writeFileSync(changelogPath, updated, "utf8");

console.log(`${currentVersion} --> ${nextVersion}`);
