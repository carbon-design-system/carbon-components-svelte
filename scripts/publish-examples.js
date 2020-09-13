const ghpages = require("gh-pages");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const ghPublish = promisify(ghpages.publish);

async function publishExample(name) {
  ghpages.clean();

  try {
    const folder_path = path.join("examples", name);
    await ghPublish(folder_path, {
      branch: name,
      dotfiles: true,
      history: false,
    });
    console.log("Published example:", name);
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await publishExample("rollup");
  await publishExample("rollup-typescript");
  await publishExample("routify");
  await publishExample("sapper");
  await publishExample("svite");
  await publishExample("webpack");
})();
