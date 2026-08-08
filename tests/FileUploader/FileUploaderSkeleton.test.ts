import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FileUploaderSkeleton from "./FileUploaderSkeleton.test.svelte";

describe("FileUploaderSkeleton", () => {
  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FileUploaderSkeleton);

    const element = screen.getByTestId("file-uploader-skeleton");

    await user.click(element);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
