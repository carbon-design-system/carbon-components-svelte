const sirv = require("sirv");
const polka = require("polka");
const { chromium } = require("playwright");
const fs = require("fs-extra");
const posthtml = require("posthtml");
const path = require("path");

const PORT = process.env.PORT || 3000;
const OUT_DIR = "dist";

async function scrape(page, url = "") {
  await page.goto(`http://localhost:${PORT}/${url}`);
  await page.waitForLoadState("networkidle");
  const $html = await page.$("html");
  const html = await page.evaluate(([html]) => html.innerHTML, [$html]);
  await $html.dispose();
  return html;
}

function relativePaths(depth = 0) {
  const asset_extension = new RegExp(/.(js|css|ico)$/);
  let relative_path = "";

  return (tree) => {
    tree.match(
      [
        { attrs: { href: asset_extension } },
        { attrs: { src: asset_extension } },
      ],
      (node) => {
        if ("href" in node.attrs) {
          node.attrs.href = relative_path + node.attrs.href;
        }

        if ("src" in node.attrs) {
          node.attrs.src = relative_path + node.attrs.src;
        }

        return node;
      }
    );

    tree.match({ attrs: { id: "__routify_iframes" } }, (node) => {});
  };
}

async function processHtml(html, { dir, outfilePath, depth }) {
  const processed = await posthtml().use(relativePaths(depth)).process(html);
  if (dir) {
    await fs.ensureDir(outfilePath);
    await fs.writeFile(
      path.join(outfilePath, "index.html"),
      await `<!DOCTYPE html><html lang="en">${processed.html}</html>`
    );
  } else {
    await fs.writeFile(
      path.join(outfilePath),
      await `<!DOCTYPE html><html lang="en">${processed.html}</html>`
    );
  }

  console.log("Prerendered:", outfilePath);
}

const app = polka()
  .use(sirv("dist", { single: true }))
  .listen(PORT, async (error) => {
    if (error) {
      console.log(error);
      process.exit(1);
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const components = await fs.readdir("src/pages/components");

    for await (const component of components) {
      const [file] = component.split(".svx");
      const filePath = `components/${file}`;
      const result = await scrape(page, filePath);

      await processHtml(result, {
        dir: true,
        outfilePath: `${OUT_DIR}/${filePath}`,
        depth: 2,
      });
    }

    await fs.ensureDir(`${OUT_DIR}/framed/`);
    await fs.ensureDir(`${OUT_DIR}/framed/Grid`);

    const framed = [
      {
        folder: "Grid",
        paths: fs.readdirSync("src/pages/framed/Grid"),
      },
      {
        folder: "Loading",
        paths: fs.readdirSync("src/pages/framed/Loading"),
      },
      {
        folder: "Modal",
        paths: fs.readdirSync("src/pages/framed/Modal"),
      },
      {
        folder: "UIShell",
        paths: fs.readdirSync("src/pages/framed/UIShell"),
      },
    ];

    for await (const frame of framed) {
      const { folder, paths } = frame;

      for await (framePath of paths) {
        const { name } = path.parse(framePath);
        await fs.ensureDir(`${OUT_DIR}/framed/${folder}/${name}`);

        const filePath = `framed/${folder}/${name}`;
        const result = await scrape(page, filePath);

        await processHtml(result, {
          dir: true,
          outfilePath: `${OUT_DIR}/${filePath}`,
          depth: 3,
        });
      }
    }

    const __404 = await scrape(page, "404");
    await processHtml(__404, { outfilePath: `${OUT_DIR}/404.html` });

    const __index = await scrape(page);
    await processHtml(__index, { outfilePath: `${OUT_DIR}/index.html` });

    await browser.close();
    await app.server.close();
    process.exit(0);
  });
