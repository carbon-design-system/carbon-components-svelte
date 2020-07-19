const components = [
  {
    title: "Button",
  },
].map((post) => ({
  ...post,
  slug: post.title.toLowerCase().replace(/\s+/g, "-"),
}));

export default components;
