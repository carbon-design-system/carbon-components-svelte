// @vitest-environment node
import { buildRoutes } from "../../docs/src/routes";

describe("buildRoutes", () => {
  it("routes page files by path, without layouts", () => {
    const { routes, notFound } = buildRoutes([
      "./pages/index.svelte",
      "./pages/_module.svelte",
      "./pages/[...404].svelte",
      "./pages/components/Button.svx",
      "./pages/framed/_module.svelte",
      "./pages/framed/Button/ButtonBasic.svelte",
    ]);
    expect([...routes.values()]).toEqual([
      {
        path: "/",
        name: "index",
        parentName: "",
        file: "./pages/index.svelte",
      },
      {
        path: "/components/Button",
        name: "Button",
        parentName: "components",
        file: "./pages/components/Button.svx",
      },
      {
        path: "/framed/Button/ButtonBasic",
        name: "ButtonBasic",
        parentName: "Button",
        file: "./pages/framed/Button/ButtonBasic.svelte",
      },
    ]);
    expect(notFound?.file).toBe("./pages/[...404].svelte");
  });
});
