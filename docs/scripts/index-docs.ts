import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { COMPONENTS_PATH } from "./constants";

const slugger = new GithubSlugger();

const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const COMPONENT_META_PATH = "./src/COMPONENT_META.json";
const COMPONENT_API_PATH = "./src/COMPONENT_API.json";
const H2_DELMIMITER = "## ";

type SearchDocument = {
  id: string;
  text: string;
  description: string;
  href: string;
  isComponent: boolean;
};

type ComponentMeta = { props: number; events: number; slots: number };

const apiCountsByModule = new Map<string, ComponentMeta>();
try {
  const api = JSON.parse(fs.readFileSync(COMPONENT_API_PATH, "utf8")) as {
    components: {
      moduleName: string;
      props?: unknown[];
      events?: unknown[];
      slots?: unknown[];
    }[];
  };
  for (const component of api.components) {
    apiCountsByModule.set(component.moduleName, {
      props: component.props?.length ?? 0,
      events: component.events?.length ?? 0,
      slots: component.slots?.length ?? 0,
    });
  }
} catch {}

const files = fs.readdirSync(COMPONENTS_PATH);
const documents: SearchDocument[] = [];
const meta: Record<string, ComponentMeta> = {};

for (const file of files) {
  slugger.reset();
  const [componentName] = file.split(".");
  if (!componentName) continue;
  const filePath = path.join(COMPONENTS_PATH, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n");

  documents.push({
    id: `${componentName}-page`,
    text: componentName,
    description: componentName,
    href: `/components/${componentName}`,
    isComponent: true,
  });

  meta[componentName] = apiCountsByModule.get(componentName) ?? {
    props: 0,
    events: 0,
    slots: 0,
  };

  for (const line of lines) {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
      if (!h2) continue;
      const hash = slugger.slug(h2);

      documents.push({
        id: componentName + hash,
        text: componentName,
        description: h2,
        href: `/components/${componentName}#${hash}`,
        isComponent: false,
      });
    }
  }
}

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(documents, null, 2));
fs.writeFileSync(COMPONENT_META_PATH, JSON.stringify(meta, null, 2));
