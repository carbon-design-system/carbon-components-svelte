// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SettingsPage from "./SettingsPage.test.svelte";

describe("SettingsPage on the server", () => {
  it("renders the section list and every row, none hidden", () => {
    const { document } = renderSSR(SettingsPage);

    const links = [...document.querySelectorAll(".bx--toc a")];
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#profile",
      "#alerts",
    ]);
    expect(document.querySelectorAll("[hidden]")).toHaveLength(0);
    expect(document.querySelectorAll(".bx--settings-row")).toHaveLength(2);
  });

  it("renders the save bar in its place, inert, so it moves nothing when it shows", () => {
    const { document } = renderSSR(SettingsPage);
    const bar = document.querySelector(".bx--settings-save-bar");

    expect(bar).toHaveAttribute("inert");
    expect(bar).not.toHaveClass("bx--settings-save-bar--visible");
    expect(bar).toHaveTextContent("Save");
  });
});
