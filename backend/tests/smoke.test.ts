describe("smoke", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has test env configured", () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});

describe("Smoke Tests", () => {
  beforeAll(() => {
    // Consolidated environment validation
    const required = ["DATABASE_URL", "JWT_SECRET"];
    const optional = [
      "RESEND_API_KEY",
      "STRIPE_SECRET_KEY",
      "EMAIL_USER",
      "EMAIL_PASSWORD",
    ];

    required.forEach((v) => {
      if (!process.env[v]) {
        throw new Error(`Missing required env var: ${v}`);
      }
    });

    optional.forEach((v) => {
      if (!process.env[v]) {
        console.warn(`⚠️  Optional env var not set: ${v}`);
      }
    });
  });

  it("should have core services configured", async () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it("should validate email service configuration", async () => {
    // Skip if no email config (per Advancia Pay: Gmail SMTP is primary)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(
        "⏭️  Skipping email test - EMAIL_USER/PASSWORD not configured",
      );
      return;
    }

    const emailConfig = {
      user: process.env.EMAIL_USER,
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
    };

    expect(emailConfig.user).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(emailConfig.host).toBeDefined();
    expect(emailConfig.port).toBeGreaterThan(0);
  });

  it("should validate database connection configuration", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain("postgresql://");
  });

  it("should validate JWT configuration", () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("should check Stripe configuration if provided", () => {
    if (process.env.STRIPE_SECRET_KEY) {
      expect(process.env.STRIPE_SECRET_KEY).toMatch(/^sk_(test|live)_/);
      console.log("✓ Stripe configured with test/live key");
    } else {
      console.warn("⚠️  Stripe not configured - payment features disabled");
    }
  });
});
