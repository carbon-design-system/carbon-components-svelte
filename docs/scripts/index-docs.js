// @ts-check
import fs from "node:fs";
import path from "node:path";
import githubSlugger from "github-slugger";

const { slug } = githubSlugger;

const COMPONENTS_PATH = "./src/pages/components";
const SEARCH_INDEX_PATH = "./src/SEARCH_INDEX.json";
const H2_DELMIMITER = "## ";

const files = fs.readdirSync(COMPONENTS_PATH);

/**
 * @typedef {Object} Document
 * @property {string} id
 * @property {string} text
 * @property {string} description
 * @property {string} href
 */

/** @type {Document[]} */
const documents = [];

for (const file of files) {
  const [componentName] = file.split(".");
  const filePath = path.join(COMPONENTS_PATH, file);
  const fileContent = fs.readFileSync(filePath, "utf8");

  for (const line of fileContent.split("\n")) {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
      const hash = slug(h2);

      documents.push({
        id: componentName + hash,
        text: componentName,
        description: h2,
        href: `/components/${componentName}#${hash}`,
      });
    }
  }
}

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(documents, null, 2));
