import components from "./_components.js";

const componentsMap = new Map();

components.forEach((post) => {
  componentsMap.set(post.slug, JSON.stringify(post));
});

export function get(req, res, next) {
  if (componentsMap.has(req.params.slug)) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(componentsMap.get(req.params.slug));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not found" }));
  }
}
