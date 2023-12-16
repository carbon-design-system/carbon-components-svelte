// @ts-check
import fs from "fs";
import path from "path";
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
  const [component_name] = file.split(".");
  const file_path = path.join(COMPONENTS_PATH, file);
  const file_content = fs.readFileSync(file_path, "utf8");

  file_content.split("\n").forEach((line) => {
    if (line.startsWith(H2_DELMIMITER)) {
      const [, h2] = line.split(H2_DELMIMITER);
      const hash = slug(h2);

      documents.push({
        id: component_name + hash,
        text: component_name,
        description: h2,
        href: `/components/${component_name}#${hash}`,
      });
    }
  });
}

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(documents, null, 2));
