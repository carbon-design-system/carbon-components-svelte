import { syncSelectionToUrl } from "../../src/utils/sync-selection-to-url.js";

describe("syncSelectionToUrl", () => {
  beforeEach(() => {
    history.replaceState(null, "", "/");
  });

  it("reads the id, or an empty string when the parameter is missing", () => {
    const url = syncSelectionToUrl({ param: "ticket" });
    expect(url.read()).toBe("");
    history.replaceState(null, "", "/?ticket=42&q=a");
    expect(url.read()).toBe("42");
  });

  it("links to an id and keeps the other parameters and the hash", () => {
    history.replaceState(null, "", "/inbox?q=a%20b&id=1#top");
    const url = syncSelectionToUrl();
    expect(url.hrefFor("7")).toBe("?q=a+b&id=7#top");
    expect(url.hrefFor("")).toBe("?q=a+b#top");
  });

  it("pushes an entry that keeps the existing state, and not for the same id", () => {
    history.replaceState({ app: 1 }, "", "/?id=1");
    const before = history.length;
    const url = syncSelectionToUrl();

    url.push("2");
    url.push("2");

    expect(history.length).toBe(before + 1);
    expect(history.state).toMatchObject({ app: 1 });
  });

  it("replaces without adding an entry", () => {
    const before = history.length;
    syncSelectionToUrl().replace("3");
    expect(location.search).toBe("?id=3");
    expect(history.length).toBe(before);
  });

  it("goes back only over an entry it pushed", async () => {
    const url = syncSelectionToUrl();
    history.replaceState(null, "", "/?id=5");

    // A deep link: nothing to go back to, so it clears the id in place.
    expect(url.back()).toBe(false);
    expect(location.search).toBe("");

    url.push("6");
    const heard: string[] = [];
    const stop = url.listen((id) => heard.push(id));
    expect(url.back()).toBe(true);
    await vi.waitFor(() => expect(heard).toEqual([""]));

    stop();
    history.forward();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heard).toEqual([""]);
  });
});
