import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { TAB_CHANNEL_NAME } from "../../src/utils/storage.js";
import SessionStorageTabs from "./SessionStorageTabs.test.svelte";

describe('SessionStorage sync="tabs"', () => {
  // Stands in for another tab on the same origin.
  let otherTab: BroadcastChannel;
  let received: unknown[];

  beforeEach(() => {
    received = [];
    otherTab = new BroadcastChannel(TAB_CHANNEL_NAME);
    otherTab.onmessage = (event) => received.push(event.data);
  });

  afterEach(() => {
    otherTab.close();
    sessionStorage.clear();
  });

  it("applies and stores a change from another tab", async () => {
    const { component } = render(SessionStorageTabs);
    await tick();

    otherTab.postMessage({ type: "set", key: "tabs-key", value: "remote" });

    await vi.waitFor(() => expect(component.value).toBe("remote"));
    expect(sessionStorage.getItem("tabs-key")).toBe("remote");
  });

  it("does not send a remote value back in canonical form", async () => {
    const { component } = render(SessionStorageTabs);
    await tick();

    otherTab.postMessage({ type: "set", key: "tabs-key", value: '{ "a": 1 }' });

    await vi.waitFor(() => expect(component.value).toEqual({ a: 1 }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received).not.toContainEqual(
      expect.objectContaining({ type: "set" }),
    );
  });

  it("sends local changes to other tabs", async () => {
    const { component } = render(SessionStorageTabs);
    await tick();

    component.value = "local";

    await vi.waitFor(() =>
      expect(received).toContainEqual({
        type: "set",
        key: "tabs-key",
        value: "local",
      }),
    );
  });

  it("takes the value from an open tab when it starts with the default", async () => {
    otherTab.onmessage = (event) => {
      if (event.data.type === "hello") {
        otherTab.postMessage({ type: "state", key: "tabs-key", value: "open" });
      }
    };
    const { component } = render(SessionStorageTabs);

    await vi.waitFor(() => expect(component.value).toBe("open"));
  });

  it("answers a new tab with its stored value", async () => {
    sessionStorage.setItem("tabs-key", "stored");
    render(SessionStorageTabs);
    await tick();

    otherTab.postMessage({ type: "hello", key: "tabs-key" });

    await vi.waitFor(() =>
      expect(received).toContainEqual({
        type: "state",
        key: "tabs-key",
        value: "stored",
      }),
    );
  });
});
