import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import PageHeaderContainerTabs from "./PageHeaderContainerTabs.test.svelte";

describe("PageHeader container tabs", () => {
  it("marks the header and drops the divider for container tabs", async () => {
    render(PageHeaderContainerTabs);
    await tick();

    const header = screen.getByTestId("container");
    expect(header).toHaveClass("bx--page-header--container-tabs");
    expect(header).not.toHaveClass("bx--page-header--divider");
  });
});
