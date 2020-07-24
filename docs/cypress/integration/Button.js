describe("Button", () => {
  beforeEach(() => {
    cy.examples("Button");
  });

  it("renders correctly", () => {
    cy.get("button").then(($) => {
      expect($.length).to.eql(4);
    });
  });

  it.only("clicks", () => {
    cy.get('[data-test="button-primary"]')
      .as("btn")
      .contains("Primary button");

    cy.get("@btn").trigger("click");
    cy.get("@log").should("be.calledWith", "click");

    cy.get("@btn").trigger("mouseover");
    cy.get("@log").should("be.calledWith", "mouseover");

    cy.get("@btn").trigger("mouseenter");
    cy.get("@log").should("be.calledWith", "mouseenter");

    cy.get("@btn").trigger("mouseleave");
    cy.get("@log").should("be.calledWith", "mouseleave");
  });
});
