import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import LocalStoragePeers from "./LocalStoragePeers.test.svelte";

describe("LocalStorage same-page sync", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("updates another instance with the same key on this page", async () => {
    const onUpdateB = vi.fn();
    const { component } = render(LocalStoragePeers, { props: { onUpdateB } });
    await tick();
    expect(component.b).toBe("a");

    component.a = "changed";
    await vi.waitFor(() => expect(component.b).toBe("changed"));
    expect(onUpdateB).toHaveBeenCalledWith({
      prevValue: "a",
      value: "changed",
    });
  });

  it("settles on the last stored value when both instances write", async () => {
    const { component } = render(LocalStoragePeers);
    await tick();

    component.a = "from-a";
    component.b = "from-b";
    await tick();
    await vi.waitFor(() => expect(component.a).toBe("from-b"));
    expect(component.b).toBe("from-b");
    expect(localStorage.getItem("peer-key")).toBe("from-b");
  });

  it("resets another instance when storage is cleared", async () => {
    const { component } = render(LocalStoragePeers);
    await tick();

    component.storageA?.clearAll();

    await vi.waitFor(() => expect(component.b).toBeUndefined());
    expect(localStorage.getItem("peer-key")).toBeNull();
  });
});
