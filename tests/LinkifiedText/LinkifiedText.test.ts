import { render, screen } from "@testing-library/svelte";
import LinkifiedText from "./LinkifiedText.test.svelte";

type Props = {
  text?: string;
  protocols?: string[];
  emails?: boolean;
  target?: "_blank";
  rel?: string;
  dir?: "rtl" | "ltr" | "auto";
};

const mount = (props: Props) => render(LinkifiedText, { props });
const root = () => screen.getByTestId("text");

describe("LinkifiedText", () => {
  it("renders URLs and email addresses as links and the rest as text", () => {
    mount({
      text: "Track it at https://ship.example.com/t/1Z9, or mail help@x.co.",
    });

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://ship.example.com/t/1Z9",
      "mailto:help@x.co",
    ]);
    expect(links.map((link) => link.textContent)).toEqual([
      "https://ship.example.com/t/1Z9",
      "help@x.co",
    ]);
    // No stray whitespace between the text and the links.
    expect(root().textContent).toBe(
      "Track it at https://ship.example.com/t/1Z9, or mail help@x.co.",
    );
  });

  it("renders markup in the text as text", () => {
    mount({
      text: '<img src=x onerror=alert(1)> <a href="javascript:alert(1)">x</a> <script>alert(1)</script>',
    });

    expect(root().querySelector("img, script")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(root().textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("does not link javascript:, data: or credentials", () => {
    mount({
      text: "javascript://%0Aalert(1) data://text/html,hi https://google.com@evil.example/",
    });

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("keeps the destination from reaching back to the page", () => {
    mount({ text: "https://example.com", target: "_blank" });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("lets rel be replaced", () => {
    mount({ text: "https://example.com", rel: "me" });

    expect(screen.getByRole("link")).toHaveAttribute("rel", "me");
  });

  it("isolates each link from the text around it, for right-to-left text", () => {
    mount({
      text: "שלום https://example.com/a. מה שלומך?",
      dir: "rtl",
    });

    expect(root()).toHaveAttribute("dir", "rtl");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("dir", "ltr");
    expect(link.textContent).toBe("https://example.com/a");
  });

  it("shows the real address for a host written in lookalike letters", () => {
    mount({ text: "Open https://аррӏе.com/login now" });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://xn--80ak6aa92e.com/login");
    expect(link.textContent).toBe("xn--80ak6aa92e.com/login");
  });

  it("shows a Unicode host that is one honest script as it was written", () => {
    mount({ text: "https://bücher.de/" });

    expect(screen.getByRole("link").textContent).toBe("https://bücher.de/");
  });

  it("accepts the schemes it is given and leaves email alone when asked", () => {
    mount({
      text: "tel:+15550100 a@b.co https://example.com",
      protocols: ["tel", "https"],
      emails: false,
    });

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(["tel:+15550100", "https://example.com/"]);
  });

  it("renders nothing for empty text", () => {
    mount({ text: "" });

    expect(root().textContent).toBe("");
  });

  it("updates when the text changes", async () => {
    const { rerender } = mount({ text: "plain" });
    expect(screen.queryByRole("link")).toBeNull();

    await rerender({ text: "see https://example.com" });

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://example.com/",
    );
  });
});
