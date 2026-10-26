// @vitest-environment node
import { render } from "svelte/server";
import StableIds from "./StableIds.test.svelte";

describe("ids from an explicit id", () => {
  const html = () => render(StableIds).body;

  it("render the same markup on every server render", () => {
    expect(html()).toBe(html());
  });

  it("derive from the id", () => {
    const body = html();

    for (const id of [
      'id="inline-title"',
      'id="toast-subtitle"',
      'id="switcher-menu"',
      'id="profile-menu"',
    ]) {
      expect(body).toContain(id);
    }
  });
});
