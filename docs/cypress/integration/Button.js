describe("Button", () => {
  beforeEach(() => {
    cy.examples("Button");
  });

  it("renders correctly", () => {
    cy.get("button").then(($) => {
      expect($.length).to.eql(4);
    });
  });
});
