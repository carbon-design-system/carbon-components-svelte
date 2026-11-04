import fs from "node:fs";
import path from "node:path";
import {
  BASE_URL,
  COMPONENT_MD_SIZES_PATH,
  COMPONENTS_PATH,
  GUIDES_OUT_DIR,
  PAGE_EXTENSION,
  PAGES_PATH,
  RAW_COMPONENTS_OUT_DIR,
} from "./constants";
import {
  asciiNormalizeGeneratedMarkdown,
  componentApi,
  type ComponentApiEntry,
  type ComponentApiEvent,
  type ComponentApiSlot,
  type ComponentApiTypedef,
  convertDocKbdToKbdForMarkdown,
  fenceInlineSvelte,
  formatMarkdown,
  formatSvelteFences,
  inlineFileSources,
  LEADING_SVELTE_SCRIPT_BLOCK_RE,
  renderGuideMarkdown,
  shiftMarkdownHeadings,
  splitFrontmatter,
} from "./markdown.ts";
import { getComponentNames, getGuideNames } from "./utils";

const componentApiByModuleName = new Map(
  componentApi.components.map((c) => [c.moduleName, c]),
);

const PIPE_RE = /\|/g;
const NEWLINE_RE = /\r?\n/g;
const AT_EXAMPLE_RE = /@example/;
const SVELTE_FENCE_RE = /```svelte\s*\n([\s\S]*?)```/;

/**
 * Parses with `Bun.YAML`, a strict YAML 1.2 parser, so frontmatter that
 * only mdsvex's lenient parser accepts fails the build.
 */
function extractComponents(
  frontmatter: string | null,
  filePath: string,
): string[] {
  if (!frontmatter) return [];

  try {
    return Bun.YAML.parse(frontmatter)?.components ?? [];
  } catch (error) {
    throw new Error(`${filePath}: invalid frontmatter`, { cause: error });
  }
}

function escapeTableCell(text: unknown) {
  return String(text ?? "")
    .replace(PIPE_RE, "\\|")
    .replace(NEWLINE_RE, "<br />")
    .trim();
}

function renderMarkdownTable(headers: string[], rows: string[][]) {
  const headerLine = `| ${headers.map(escapeTableCell).join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map(
    (cells: string[]) => `| ${cells.map(escapeTableCell).join(" | ")} |`,
  );
  return [headerLine, sepLine, ...rowLines].join("\n");
}

function parseDescription(description: string) {
  if (!description) return { mainDescription: "", exampleCode: null };

  const exampleIndex = description.search(AT_EXAMPLE_RE);
  if (exampleIndex === -1) {
    return { mainDescription: description.trim(), exampleCode: null };
  }

  const mainDescription = description.slice(0, exampleIndex).trim();
  const exampleSection = description.slice(exampleIndex);
  const codeBlockMatch = exampleSection.match(SVELTE_FENCE_RE);
  const exampleCode = codeBlockMatch ? codeBlockMatch[1].trim() : null;

  return { mainDescription, exampleCode };
}

function renderPropsSection(
  component: ComponentApiEntry,
  componentName: string,
) {
  const props = Array.isArray(component.props) ? component.props : [];
  if (props.length === 0) return "";

  const sorted = [...props].sort((a, b) => {
    if (a.isRequired !== b.isRequired) return b.isRequired ? 1 : -1;
    if (a.reactive !== b.reactive) return b.reactive ? 1 : -1;
    return 0;
  });

  const rows = sorted.map((prop) => {
    const markers = [
      prop.reactive ? "Reactive" : null,
      prop.isRequired ? "Required" : null,
    ].filter(Boolean);

    const nameCell = [
      `\`${prop.name}\``,
      markers.length ? `(${markers.join(", ")})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const { mainDescription } = parseDescription(prop.description ?? "");

    const typeCell = prop.type ? `\`${prop.type}\`` : "";

    const value = prop.value;
    const defaultCell =
      value === undefined || value === "undefined"
        ? "_undefined_"
        : `\`${String(value)}\``;

    return [nameCell, typeCell, mainDescription, defaultCell];
  });

  return `### \`${componentName}\` props\n\n${renderMarkdownTable(
    ["Prop", "Type", "Description", "Default"],
    rows,
  )}`;
}

function renderTypedefsSection(
  component: ComponentApiEntry,
  componentName: string,
) {
  const typedefs = Array.isArray(component.typedefs) ? component.typedefs : [];
  if (typedefs.length === 0) return "";

  const ts = typedefs
    .map((t: ComponentApiTypedef) => t?.ts)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!ts) return "";

  return `### \`${componentName}\` typedefs\n\n\`\`\`ts\n${ts}\n\`\`\``;
}

function renderSlotsSection(
  component: ComponentApiEntry,
  componentName: string,
) {
  const slots = Array.isArray(component.slots) ? component.slots : [];
  if (slots.length === 0) return "";

  const rows = slots.map((slot: ComponentApiSlot) => {
    const name =
      slot?.default || slot?.name == null ? "default" : String(slot.name);
    const detail = slot?.slot_props ? String(slot.slot_props) : "";
    return [`\`${name}\``, detail ? `\`${detail}\`` : ""];
  });

  return `### \`${componentName}\` slots\n\n${renderMarkdownTable(["Slot", "Detail"], rows)}`;
}

function renderEventsSection(
  component: ComponentApiEntry,
  componentName: string,
) {
  const events = Array.isArray(component.events) ? component.events : [];
  const forwarded = events.filter(
    (e: ComponentApiEvent) => e?.type === "forwarded",
  );
  const dispatched = events.filter(
    (e: ComponentApiEvent) => e?.type === "dispatched",
  );

  if (forwarded.length === 0 && dispatched.length === 0) return "";

  const forwardedMd =
    forwarded.length === 0
      ? ""
      : `### \`${componentName}\` forwarded events\n\n${renderMarkdownTable(
          ["Event"],
          forwarded.map((e: ComponentApiEvent) => [`\`on:${e.name}\``]),
        )}`;

  const hasDispatchedDescription = dispatched.some(
    (e: ComponentApiEvent) => e?.description,
  );
  const dispatchedHeaders = hasDispatchedDescription
    ? ["Event", "Detail", "Description"]
    : ["Event", "Detail"];

  const dispatchedRows =
    dispatched.length === 0
      ? null
      : dispatched.map((e: ComponentApiEvent) => {
          const base = [
            `\`on:${e.name}\``,
            e.detail ? `\`${String(e.detail)}\`` : "",
          ];
          if (hasDispatchedDescription) base.push(e.description ?? "");
          return base;
        });

  const dispatchedMd =
    dispatched.length === 0
      ? ""
      : `### \`${componentName}\` dispatched events\n\n${renderMarkdownTable(
          dispatchedHeaders,
          dispatchedRows ?? [],
        )}`;

  const sections = [forwardedMd, dispatchedMd].filter(Boolean);
  return sections.join("\n\n");
}

function renderRestPropsSection(
  component: ComponentApiEntry,
  componentName: string,
) {
  const rest = component?.rest_props;
  if (!rest) return "";

  if (rest.type === "Element") {
    return `### \`${componentName}\` $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` element.`;
  }

  return `### \`${componentName}\` $$restProps\n\n\`${component.moduleName}\` spreads \`$$restProps\` to the \`${rest.name}\` component.`;
}

function renderComponentApiMarkdown(moduleName: string) {
  const entry = componentApiByModuleName.get(moduleName);
  if (!entry) {
    throw new Error(`API data not found for component: ${moduleName}`);
  }

  const sections = [
    renderPropsSection(entry, moduleName),
    renderTypedefsSection(entry, moduleName),
    renderSlotsSection(entry, moduleName),
    renderEventsSection(entry, moduleName),
    renderRestPropsSection(entry, moduleName),
  ].filter(Boolean);

  return sections.join("\n\n");
}

function generateLlmTxt(
  componentNames: string[],
  guides: { name: string; title: string }[],
) {
  const sorted = [...componentNames].sort();
  const links = sorted.map(
    (name) => `- [${name}](${BASE_URL}/components/${name}.md)`,
  );
  const guideLinks = guides.map(
    ({ name, title }) => `- [${title}](${BASE_URL}/guides/${name}.md)`,
  );
  return `# Carbon Components Svelte

## Guides

${guideLinks.join("\n")}

## Docs

${links.join("\n")}
`;
}

// Fresh output every run.
fs.rmSync(RAW_COMPONENTS_OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(RAW_COMPONENTS_OUT_DIR, { recursive: true });

const generatedMdByComponent: { componentName: string; md: string }[] = [];

for (const componentName of getComponentNames()) {
  const filePath = path.join(
    COMPONENTS_PATH,
    `${componentName}${PAGE_EXTENSION}`,
  );
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(fileContent);
  const components = extractComponents(frontmatter, filePath);

  const componentsForUsage =
    components.length > 0 ? components : [componentName];

  const bodyWithoutLeadingScript = body.replace(
    LEADING_SVELTE_SCRIPT_BLOCK_RE,
    "",
  );
  const bodyWithKbd = convertDocKbdToKbdForMarkdown(bodyWithoutLeadingScript);
  const bodyWithInlinedFileSources = inlineFileSources(bodyWithKbd);
  const fencedBody = fenceInlineSvelte(bodyWithInlinedFileSources);

  const apiSections = componentsForUsage
    .map(renderComponentApiMarkdown)
    .filter(Boolean);
  const apiMarkdown =
    apiSections.length > 0
      ? `\n\n---\n\n## Component API\n\n${apiSections.join("\n\n")}`
      : "";

  const generatedMd = `# ${componentName}\n\n${fencedBody}${apiMarkdown}`;

  generatedMdByComponent.push({ componentName, md: generatedMd });
}

const componentMdSizes: Record<string, number> = {};

await Promise.all(
  generatedMdByComponent.map(async ({ componentName, md }) => {
    const svelteFormatted = await formatSvelteFences(md);
    const docFormatted = await formatMarkdown(svelteFormatted);
    const docOut = asciiNormalizeGeneratedMarkdown(docFormatted);
    fs.writeFileSync(
      path.join(RAW_COMPONENTS_OUT_DIR, `${componentName}.md`),
      docOut,
      "utf8",
    );
    componentMdSizes[componentName] = Buffer.byteLength(docOut, "utf8");
  }),
);

fs.writeFileSync(
  COMPONENT_MD_SIZES_PATH,
  `${JSON.stringify(componentMdSizes, null, 2)}\n`,
  "utf8",
);

// Guides: the pages directly under `src/pages`.
fs.rmSync(GUIDES_OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(GUIDES_OUT_DIR, { recursive: true });

const generatedGuides = await Promise.all(
  getGuideNames().map(async (name) => {
    const source = fs.readFileSync(
      path.join(PAGES_PATH, `${name}${PAGE_EXTENSION}`),
      "utf8",
    );
    const { title, md } = await renderGuideMarkdown(source, { name });
    fs.writeFileSync(path.join(GUIDES_OUT_DIR, `${name}.md`), md, "utf8");
    return { name, title, md };
  }),
);

// Generate llms.txt file
const componentNames = generatedMdByComponent.map(
  ({ componentName }) => componentName,
);
const llmTxtContent = generateLlmTxt(componentNames, generatedGuides);
fs.writeFileSync(path.join("./public", "llms.txt"), llmTxtContent, "utf8");

// Generate llms-full.txt: overview + guides + all component docs with headings shifted
const overviewPath = path.join("./content", "overview.md");
let overviewMd: string;
try {
  overviewMd = fs.readFileSync(overviewPath, "utf8").trim();
} catch (err) {
  throw new Error(
    `Overview file required for llms-full.txt not found: ${overviewPath}`,
    { cause: err },
  );
}
const sortedByComponentName = [...generatedMdByComponent].sort((a, b) =>
  a.componentName.localeCompare(b.componentName),
);
const introPart = `# Carbon Components Svelte\n\n${overviewMd}`;
const formattedIntro = asciiNormalizeGeneratedMarkdown(
  (await formatMarkdown(introPart)).trimEnd(),
);
const guideParts = generatedGuides.map(({ md }) => shiftMarkdownHeadings(md));
const componentParts = sortedByComponentName.map(({ componentName }) => {
  const formattedPath = path.join(
    RAW_COMPONENTS_OUT_DIR,
    `${componentName}.md`,
  );
  const formattedMd = fs.readFileSync(formattedPath, "utf8");
  return shiftMarkdownHeadings(formattedMd);
});
const fullParts = [formattedIntro, ...guideParts, ...componentParts];
fs.writeFileSync(
  path.join("./public", "llms-full.txt"),
  asciiNormalizeGeneratedMarkdown(fullParts.join("\n\n")),
  "utf8",
);
