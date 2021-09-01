import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [],
  kit: {
    adapter: adapter(),
    target: "#svelte",
    files: {
      assets: "app/static",
      lib: "app/lib",
      routes: "app/routes",
      template: "app/app.html",
    },
  },
};

export default config;
