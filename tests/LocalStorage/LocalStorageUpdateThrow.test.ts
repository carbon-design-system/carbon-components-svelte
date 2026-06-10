import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import {
  absorbUnhandledRejection,
  CONSUMER_BOOM,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import { setupLocalStorageMock } from "../utils/storage-mocks";
import LocalStorageHardening from "./LocalStorageHardening.test.svelte";

describe("LocalStorage update when handler throws", () => {
  const { getMockItem } = setupLocalStorageMock();

  it("keeps persisting after a consumer's update handler throws", async () => {
    const seen: Array<{ prevValue: unknown; value: unknown }> = [];
    let shouldThrow = false;
    const { component } = render(LocalStorageHardening, {
      props: {
        key: "k",
        value: "v0",
        onUpdate: (e: CustomEvent) => {
          seen.push(e.detail);
          if (shouldThrow) throw new Error(CONSUMER_BOOM);
        },
      },
    });
    await tick();

    const trap = absorbUnhandledRejection(isConsumerBoom);
    shouldThrow = true;
    component.value = "v1";

    await trap.wait;
    await tick();
    trap.dispose();

    await vi.waitFor(() => {
      expect(getMockItem("k")).toBe("v1");
    });

    shouldThrow = false;
    component.value = "v2";
    await vi.waitFor(() => {
      expect(getMockItem("k")).toBe("v2");
    });

    await vi.waitFor(() => {
      expect(seen).toEqual([
        { prevValue: "v0", value: "v1" },
        { prevValue: "v1", value: "v2" },
      ]);
    });
  });
});
