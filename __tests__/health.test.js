
/**
 * @fileoverview Jest tests for the /api/health endpoint
 */

import { app } from "../index"; // Adjust the path to your app's entry point
import request from "supertest";

describe("API Route for Health Check", () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe("GET /api/health", () => {
    it("should return a success message and uptime", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Server is running");
      expect(response.body).toHaveProperty("uptime");
    });
  });
});
