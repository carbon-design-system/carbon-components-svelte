import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import IPAddressInput from "./IPAddressInput.test.svelte";

const input = () => screen.getByRole<HTMLInputElement>("textbox");
const shown = (id: "value" | "valid" | "parsed") =>
  screen.getByTestId(id).textContent;
const preview = () => document.querySelector(".bx--ip-address-input__preview");
const errorText = () =>
  document.querySelector(".bx--form-requirement")?.textContent?.trim();

describe("IPAddressInput", () => {
  describe("validation", () => {
    it("waits for the commit before it shows an error, then keeps up", async () => {
      render(IPAddressInput);

      await user.type(input(), "10.0.0.256");
      expect(input()).not.toHaveAttribute("aria-invalid");
      expect(shown("valid")).toBe("false");

      await user.tab();
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(errorText()).toBe("Octet 4 is greater than 255");
      expect(input()).toHaveAttribute(
        "aria-errormessage",
        document.querySelector(".bx--form-requirement")?.id,
      );

      // Once shown, the error follows the text: fixing it clears it.
      await user.click(input());
      await user.keyboard("{Backspace}");
      expect(input()).not.toHaveAttribute("aria-invalid");
      expect(shown("valid")).toBe("true");
    });

    it("shows the error from the first character with validateOn='input'", async () => {
      render(IPAddressInput, { config: { validateOn: "input" } });

      await user.type(input(), "10.0.0.");
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(errorText()).toBe("Octet 4 is empty");
    });

    it("sets the browser's own validity, so a form will not submit", async () => {
      render(IPAddressInput);
      await user.type(input(), "nope");
      expect(input().validationMessage).not.toBe("");
      await user.clear(input());
      expect(input().validationMessage).toBe("");
    });

    it("names the host bits and the network to use", async () => {
      render(IPAddressInput, { config: { allow: ["cidr"] } });
      await user.type(input(), "10.0.1.77/24");
      await user.tab();
      expect(errorText()).toBe("Host bits set: did you mean 10.0.1.0/24?");
    });

    it("lets the consumer's invalid state take over", () => {
      render(IPAddressInput, {
        value: "10.0.0.1",
        config: { invalid: true, invalidText: "Already in use" },
      });
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(errorText()).toBe("Already in use");
    });

    it("translates a message by its code", async () => {
      render(IPAddressInput, {
        config: {
          validateOn: "input",
          translateWithId: (id, params) =>
            id === "octet-too-large" ? `octeto ${params.octet}` : undefined,
        },
      });
      await user.type(input(), "1.2.300.4");
      expect(errorText()).toBe("octeto 3");
    });

    it("reports within and excludes by the block that decides", async () => {
      render(IPAddressInput, {
        config: {
          allow: ["cidr"],
          within: "10.0.0.0/16",
          excludes: ["10.0.5.0/24"],
          validateOn: "input",
        },
      });
      await user.type(input(), "10.1.0.0/24");
      expect(errorText()).toBe("Must be inside 10.0.0.0/16");
      await user.clear(input());
      await user.type(input(), "10.0.5.0/25");
      expect(errorText()).toBe("Overlaps 10.0.5.0/24");
      await user.clear(input());
      await user.type(input(), "10.0.6.0/24");
      expect(input()).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("normalization", () => {
    it("rewrites a valid entry to its canonical form on commit", async () => {
      const onChange = vi.fn();
      render(IPAddressInput, { onChange });

      await user.type(input(), "2001:0DB8:0:0:0:0:0:0001");
      expect(input()).toHaveValue("2001:0DB8:0:0:0:0:0:0001");
      await user.tab();

      expect(input()).toHaveValue("2001:db8::1");
      expect(shown("value")).toBe("2001:db8::1");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toMatchObject({
        value: "2001:db8::1",
        error: null,
        parsed: { version: 6, prefix: null },
      });
    });

    it("leaves invalid text as typed", async () => {
      render(IPAddressInput);
      await user.type(input(), "010.0.0.1");
      await user.tab();
      expect(input()).toHaveValue("010.0.0.1");
    });

    it("keeps the text with normalizeOnBlur off", async () => {
      render(IPAddressInput, { config: { normalizeOnBlur: false } });
      await user.type(input(), "0:0:0:0:0:0:0:1");
      await user.tab();
      expect(input()).toHaveValue("0:0:0:0:0:0:0:1");
      expect(shown("parsed")).toBe("::1");
    });

    it("reads text from an input method", () => {
      render(IPAddressInput, { value: "１０．０．０．１" });
      expect(shown("valid")).toBe("true");
      expect(shown("parsed")).toBe("10.0.0.1");
    });
  });

  describe("preview", () => {
    it("sizes a CIDR block and names the usable hosts", async () => {
      render(IPAddressInput, { config: { allow: ["cidr"] } });
      await user.type(input(), "10.0.0.0/24");

      expect(preview()?.textContent?.replace(/\s+/g, " ")).toContain(
        "256 addresses: 10.0.0.0 – 10.0.0.255",
      );
      const rows = [
        ...document.querySelectorAll(".bx--ip-address-input__details > *"),
      ].map((n) => n.textContent?.replace(/\s+/g, " ").trim());
      expect(rows).toEqual([
        "Network",
        "10.0.0.0",
        "Broadcast",
        "10.0.0.255",
        "Usable",
        "10.0.0.1 – 10.0.0.254 (254)",
      ]);
      expect(input().getAttribute("aria-describedby")).toContain(preview()?.id);
    });

    it("sizes IPv6 blocks as a power of two", async () => {
      render(IPAddressInput, { config: { allow: ["cidr"] } });
      await user.type(input(), "2001:db8::/64");
      expect(preview()?.textContent).toContain("2^64 addresses");
      // IPv6 has no broadcast address.
      expect(
        document.querySelector(".bx--ip-address-input__details"),
      ).toBeNull();
    });

    it("shows a range and still shows the block that fails a check", async () => {
      render(IPAddressInput, {
        config: { allow: ["range", "cidr"], within: "10.0.0.0/16" },
      });
      await user.type(input(), "10.9.0.0/24");
      expect(preview()?.textContent).toContain("256 addresses");
      expect(shown("valid")).toBe("false");
      await user.clear(input());
      await user.type(input(), "10.0.0.1-10.0.0.50");
      expect(preview()?.textContent).toContain("50 addresses");
    });

    it("shows the compressed form of an address while it is typed", async () => {
      render(IPAddressInput);
      await user.type(input(), "2001:0db8:0000:0000:0000:0000:0000:0001");
      expect(preview()?.textContent).toContain("Normalized: 2001:db8::1");
      await user.clear(input());
      await user.type(input(), "10.0.0.1");
      expect(preview()).toBeNull();
    });

    it("is hidden with hidePreview, and when the text does not parse", async () => {
      render(IPAddressInput, {
        config: { allow: ["cidr"], hidePreview: true },
      });
      await user.type(input(), "10.0.0.0/24");
      expect(preview()).toBeNull();
    });
  });

  describe("field", () => {
    it("turns off autocorrect and spellcheck", () => {
      render(IPAddressInput);
      expect(input()).toHaveAttribute("spellcheck", "false");
      expect(input()).toHaveAttribute("autocapitalize", "off");
    });

    it("gives an example of each accepted form as helper text", () => {
      render(IPAddressInput, { config: { allow: ["address", "cidr"] } });
      expect(
        document.querySelector(".bx--form__helper-text")?.textContent?.trim(),
      ).toBe("Example: 10.0.0.1, 10.0.0.0/24");
    });
  });
});
