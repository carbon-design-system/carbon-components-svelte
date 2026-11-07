import path from "node:path";

const SCRIPT_TAG_RE = /^<script\b/i;
const COMPONENT_PAGE = `${path.sep}pages${path.sep}components${path.sep}`;

type Tree = { children?: { type?: string; value?: string }[] };

/**
 * A component page's lead lives in its frontmatter `description`. A leading
 * body paragraph would render above the first heading, apart from both.
 */
export function requireLeadingHeading() {
  return (tree: Tree, file: { filename?: string }) => {
    const filename = file.filename;
    if (!filename?.includes(COMPONENT_PAGE)) return;

    const first = tree.children?.find(
      (node) =>
        node.type !== "yaml" &&
        !(node.type === "html" && SCRIPT_TAG_RE.test(node.value ?? "")),
    );
    if (first?.type !== "paragraph") return;

    throw new Error(
      `${path.basename(filename)}: the body starts with a paragraph. Put the lead sentence in the frontmatter \`description\` and the rest under the first \`##\` heading. See "Component documentation" in CONTRIBUTING.md.`,
    );
  };
}
