// "Report bug": a prefilled GitHub issue with the REPL link, exact versions,
// recent console errors and the code. The link always survives; code and logs
// are dropped first when the URL would get too long for GitHub.

export const ISSUE_REPO = "carbon-design-system/carbon-components-svelte";
const MAX_URL = 7500;
const FENCE = "```";

/**
 * @param {{
 *   href: string;
 *   versions: Record<string, string>;
 *   files: { name: string; source: string }[];
 *   problems: { level: string; text: string }[];
 *   userAgent?: string;
 * }} report
 */
export function buildIssue({ href, versions, files, problems, userAgent }) {
  const title = "[REPL] ";
  const versionLine = Object.entries(versions)
    .map(
      ([pkg, v]) =>
        `${pkg === "ccs" ? "carbon-components-svelte" : pkg === "icons" ? "carbon-icons-svelte" : pkg} ${v}`,
    )
    .join(" · ");
  const head = [
    "### Reproduction",
    "",
    `[Open in the Carbon REPL](${href})`,
    "",
    "### Expected",
    "",
    "",
    "### Actual",
    "",
    "",
    "### Versions",
    "",
    versionLine,
    userAgent ? `\n${userAgent}` : "",
  ].join("\n");

  const logs = problems
    .slice(-10)
    .map((p) => `[${p.level}] ${p.text}`.slice(0, 300));
  const logSection = logs.length
    ? ["", "", "### Console", "", FENCE, ...logs, FENCE].join("\n")
    : "";
  const codeSection = files
    .map((f) =>
      [
        `#### ${f.name}`,
        "",
        `${FENCE}${f.name.endsWith(".svelte") ? "svelte" : "js"}`,
        f.source.trimEnd(),
        FENCE,
      ].join("\n"),
    )
    .join("\n\n");

  const candidates = [
    `${head}${logSection}\n\n### Code\n\n${codeSection}`,
    `${head}${logSection}\n\n### Code\n\nThe code is in the REPL link above.`,
    `${head}\n\nThe code and console output are in the REPL link above.`,
  ];
  for (const body of candidates) {
    const url = issueUrl(title, body);
    if (url.length <= MAX_URL) return { title, body, url };
  }
  const body = candidates.at(-1);
  return { title, body, url: issueUrl(title, body) };
}

export function issueUrl(title, body) {
  const params = new URLSearchParams({ title, body });
  return `https://github.com/${ISSUE_REPO}/issues/new?${params}`;
}
