// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

// A focus ring should snap, so a transition must name its properties (no
// `all`, no bare duration) and leave out the property drawing the ring.
const transitionProperties = async (selector: string) => {
  const value = parseRules(await compileEntry("all.scss"))
    .find(
      (r) =>
        r.selector === selector &&
        r.context === "" &&
        r.decls.has("transition"),
    )
    ?.decls.get("transition");
  return value?.split(/,(?![^(]*\))/).map((part) => part.trim().split(" ")[0]);
};

describe("focus ring transitions", () => {
  it("file uploader browse button fades only its color", async () => {
    expect(await transitionProperties(".bx--file-browse-btn")).toEqual([
      "color",
    ]);
  }, 30_000);
});
