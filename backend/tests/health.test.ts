import request from "supertest";
import app from "../src/app";

describe("Health Endpoints", () => {
  describe("GET /", () => {
    it("returns backend running message", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Backend running");
    });
  });

  describe("GET /health", () => {
    it("returns health status with correct structure", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("service", "advancia-backend");
      expect(response.body).toHaveProperty("version");
    });

    it("timestamp is a valid ISO date string", async () => {
      const response = await request(app).get("/health");

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});
