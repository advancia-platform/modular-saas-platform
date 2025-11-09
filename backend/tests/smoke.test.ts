describe("smoke", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has test env configured", () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
