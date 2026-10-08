import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import FormRequirementTest from "./FormRequirement.test.svelte";

describe("FormRequirement", () => {
  it("marks the control invalid and describes it with the error first", () => {
    render(FormRequirementTest, { props: { error: "Enter an email" } });

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Enter an email");
    expect(message).toHaveAttribute("id", "error-email");
    expect(message).toHaveClass(
      "bx--form-requirement",
      "bx--form-requirement--invalid",
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "error-email helper-email",
    );
    expect(screen.getByTestId("state")).toHaveTextContent("true:false");
  });

  it("clears aria-invalid when the error unmounts", async () => {
    const { component } = render(FormRequirementTest, {
      props: { error: "Enter an email" },
    });

    component.error = "";
    await tick();

    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", "helper-email");
    expect(screen.getByTestId("state")).toHaveTextContent("false:false");
  });

  it("describes the control with a warning without marking it invalid", () => {
    render(FormRequirementTest, { props: { warning: "Personal address" } });

    const message = screen.getByText("Personal address");
    expect(message).toHaveAttribute("id", "warn-email");
    expect(message).not.toHaveAttribute("role");
    expect(message).toHaveClass("bx--form-requirement--warn");

    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "warn-email helper-email",
    );
    expect(screen.getByTestId("state")).toHaveTextContent("false:true");
  });

  it("renders standalone with its own id", () => {
    render(FormRequirementTest);

    expect(screen.getByText("Standalone")).toHaveAttribute("id", "standalone");
  });
});
