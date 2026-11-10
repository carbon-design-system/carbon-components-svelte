/**
 * Links that help a reader fix or report a docs page. `file` is a route's
 * file, relative to `docs/src`, such as `./pages/components/Button.md`.
 */
export function editPageUrl(repo: string, file: string): string {
  return `${repo}/edit/master/docs/src/${file.replace(/^\.\//, "")}`;
}

/** A new issue, titled with the page's name and linked to the page. */
export function reportIssueUrl(
  repo: string,
  name: string,
  pageUrl: string,
): string {
  const params = new URLSearchParams({
    title: `${name}: `,
    body: `Page: ${pageUrl}\n\n`,
  });
  return `${repo}/issues/new?${params}`;
}

/** Open issues with the component's name in the title. */
export function openIssuesUrl(repo: string, name: string): string {
  const params = new URLSearchParams({
    q: `is:issue is:open in:title ${name}`,
  });
  return `${repo}/issues?${params}`;
}
