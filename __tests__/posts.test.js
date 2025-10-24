
/**
 * @fileoverview Jest tests for the /api/posts endpoint
 */

// Mock the supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [{ id: "1", title: "Test Post", body: "This is a test post.", user_id: "123" }], error: null }),
      })),
    })),
  })),
}));

import { app } from "../index"; // Adjust the path to your app's entry point
import request from "supertest";

describe("API Routes for Posts", () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe("GET /api/posts", () => {
    it("should return a list of posts", async () => {
      const response = await request(app).get("/api/posts");
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/posts", () => {
    it("should create a new post", async () => {
      const newPost = {
        title: "Test Post",
        body: "This is a test post.",
        user_id: "123",
      };
      const response = await request(app).post("/api/posts").send(newPost);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("title", "Test Post");
    });

    it("should return a 400 error for missing data", async () => {
      const newPost = {
        title: "Test Post",
      };
      const response = await request(app).post("/api/posts").send(newPost);
      expect(response.status).toBe(400);
    });
  });
});
