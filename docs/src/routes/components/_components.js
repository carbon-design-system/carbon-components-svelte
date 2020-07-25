import fs from "fs";
import path from "path";

const components = [
  {
    title: "Button",
    source: fs.readFileSync(
      path.resolve(process.cwd(), "./src/routes/examples/Button.svelte"),
      "utf8"
    ),
    props: {
      size: {
        values: ["default", "field", "small"],
        default: "default",
      },
    },
  },
].map((post) => ({
  ...post,
  slug: post.title.toLowerCase().replace(/\s+/g, "-"),
}));

export default components;
