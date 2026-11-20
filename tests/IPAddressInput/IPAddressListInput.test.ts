import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import IPAddressListInput from "./IPAddressListInput.test.svelte";

const input = () => screen.getByRole<HTMLInputElement>("textbox");
const shownValue = (): string[] =>
  JSON.parse(screen.getByTestId("value").textContent ?? "[]");
const paste = (text: string) =>
  fireEvent.paste(input(), { clipboardData: { getData: () => text } });
const errorText = () =>
  document.querySelector(".bx--form-requirement")?.textContent?.trim();

describe("IPAddressListInput", () => {
  it("adds a block in canonical form on Enter", async () => {
    render(IPAddressListInput);
    await user.type(input(), "2001:0DB8:0:0::/32{Enter}");
    expect(shownValue()).toEqual(["2001:db8::/32"]);
  });

  it("splits on a space or a comma", async () => {
    render(IPAddressListInput);
    await user.type(input(), "10.0.0.0/24 192.168.0.1,");
    expect(shownValue()).toEqual(["10.0.0.0/24", "192.168.0.1"]);
  });

  it("rejects an entry with the parser's message and keeps the text", async () => {
    const onInvalid = vi.fn();
    render(IPAddressListInput, { onInvalid });
    await user.type(input(), "10.0.1.77/24{Enter}");
    expect(shownValue()).toEqual([]);
    expect(input()).toHaveValue("10.0.1.77/24");
    expect(errorText()).toBe("Host bits set: did you mean 10.0.1.0/24?");
    expect(onInvalid).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "validate" }),
    );
  });

  it("treats two spellings of one address as a duplicate", async () => {
    render(IPAddressListInput);
    await user.type(input(), "::1 0:0:0:0:0:0:0:1 ");
    expect(shownValue()).toEqual(["::1"]);
    expect(errorText()).toBe("This tag has already been added");
  });

  it("holds entries inside and outside bounds to within and excludes", async () => {
    render(IPAddressListInput, {
      config: { within: "10.0.0.0/16", excludes: "10.0.5.0/24" },
    });
    await user.type(input(), "10.0.1.0/24 10.1.0.0/24 ");
    expect(shownValue()).toEqual(["10.0.1.0/24"]);
    expect(errorText()).toBe("Must be inside 10.0.0.0/16");
    await user.clear(input());
    await user.type(input(), "10.0.5.0/25 ");
    expect(shownValue()).toEqual(["10.0.1.0/24"]);
    expect(errorText()).toBe("Overlaps 10.0.5.0/24");
  });

  it("keeps whitespace inside a range when ranges are allowed", async () => {
    render(IPAddressListInput, { config: { allow: ["cidr", "range"] } });
    await user.type(input(), "10.0.0.1 - 10.0.0.9, 10.0.0.0/24,");
    expect(shownValue()).toEqual(["10.0.0.1-10.0.0.9", "10.0.0.0/24"]);
  });

  it("takes a pasted list of 100 CIDR blocks in one go", async () => {
    const blocks = Array.from({ length: 100 }, (_, i) => `10.${i}.0.0/16`);
    render(IPAddressListInput);
    await paste(blocks.join("\n"));
    expect(shownValue()).toEqual(blocks);
    expect(screen.getByTestId("count")).toHaveTextContent("100");
    expect(input()).toHaveValue("");
  });

  it("takes a messy pasted list and keeps only the entries to fix", async () => {
    const text = [
      "10.0.0.0/24, 10.0.1.0/24",
      "  192.168.0.0/16\t",
      "10.0.0.0/24",
      "10.0.2.9/24",
      "‎2001:DB8::/32‏",
      "not-an-ip",
      "1.2.3.4/33",
    ].join("\n");
    render(IPAddressListInput);
    await paste(text);
    expect(shownValue()).toEqual([
      "10.0.0.0/24",
      "10.0.1.0/24",
      "192.168.0.0/16",
      "2001:db8::/32",
    ]);
    // The rejected ones come back to the field to be fixed.
    expect(input()).toHaveValue("10.0.0.0/24,10.0.2.9/24,not-an-ip,1.2.3.4/33");
  });

  it("takes a pasted list of 500 entries", async () => {
    const blocks = Array.from(
      { length: 500 },
      (_, i) => `10.${i >> 8}.${i & 255}.0/24`,
    );
    render(IPAddressListInput);
    await paste(blocks.join("\n"));
    expect(shownValue()).toHaveLength(500);
  });

  it("shows each entry left to right", () => {
    render(IPAddressListInput, { value: ["::1/128"] });
    expect(document.querySelector(".bx--tag bdi")).toHaveAttribute(
      "dir",
      "ltr",
    );
    expect(input()).toHaveAttribute("dir", "ltr");
  });

  it("removes an entry with its button", async () => {
    render(IPAddressListInput, { value: ["10.0.0.0/24", "10.0.1.0/24"] });
    await user.click(
      screen.getByRole("button", { name: "Remove 10.0.0.0/24" }),
    );
    expect(shownValue()).toEqual(["10.0.1.0/24"]);
  });
});
