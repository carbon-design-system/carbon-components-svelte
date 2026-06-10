import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import {
  absorbUnhandledRejection,
  CONSUMER_BOOM,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import FileUploaderThrow from "./FileUploaderThrow.test.svelte";

describe("FileUploader on:add when handler throws", () => {
  it("renders the file row even when on:add throws", async () => {
    const onAdd = vi.fn(() => {
      throw new Error(CONSUMER_BOOM);
    });
    const { component } = render(FileUploaderThrow, { props: { onAdd } });
    const trap = absorbUnhandledRejection(isConsumerBoom);

    component.files = [new File(["a"], "a.txt", { type: "text/plain" })];

    await vi.waitFor(() => {
      expect(screen.queryByText("a.txt")).toBeInTheDocument();
    });
    await vi.waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
    await trap.wait;
    await tick();
    trap.dispose();
  });
});
