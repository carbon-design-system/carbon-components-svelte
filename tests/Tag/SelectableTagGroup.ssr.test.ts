// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SelectableTagGroup from "./SelectableTagGroup.test.svelte";

describe("SelectableTagGroup server render", () => {
  it("renders the selection and keeps every tag reachable without JS", () => {
    const { document } = renderSSR(SelectableTagGroup, {
      selected: ["closed"],
    });
    const tags = [...document.querySelectorAll("button")];

    expect(tags.map((tag) => tag.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(tags.some((tag) => tag.getAttribute("tabindex") === "-1")).toBe(
      false,
    );
  });

  it("derives the legend id from the id prop", () => {
    const { document } = renderSSR(SelectableTagGroup, { id: "status" });
    const group = document.querySelector("[role=group]");

    expect(group?.id).toBe("status");
    expect(group?.getAttribute("aria-labelledby")).toBe("status-legend");
    expect(document.getElementById("status-legend")?.textContent?.trim()).toBe(
      "Status",
    );
  });

  it("names the group from its legend", () => {
    const { document } = renderSSR(SelectableTagGroup);
    const group = document.querySelector("[role=group]");
    const legend = document.getElementById(
      group?.getAttribute("aria-labelledby") ?? "",
    );

    expect(legend?.textContent?.trim()).toBe("Status");
  });
});
