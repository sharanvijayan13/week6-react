/**
 * @fileoverview Express.js API server for blog posts management
 * @description A RESTful API server that handles CRUD operations for blog posts
 * using Supabase as the database backend. Provides endpoints for creating and
 * retrieving blog posts with proper error handling and validation.
 * @author Sharan
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file
dotenv.config();

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Supabase client instance for database operations
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== MIDDLEWARE CONFIGURATION ====================

/**
 * Enable Cross-Origin Resource Sharing (CORS) for all routes
 * Allows frontend applications to make requests to this API
 */
app.use(cors());

/**
 * Parse incoming JSON requests
 * Enables the server to handle JSON payloads in request bodies
 */
app.use(express.json());

// ==================== VALIDATION MIDDLEWARE ====================

/**
 * Validates required fields for post creation
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
const validatePostData = (req, res, next) => {
  const { title, body, user_id } = req.body;

  // Check if all required fields are present
  if (!title || !body || !user_id) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Title, body, and user_id are required",
      required: ["title", "body", "user_id"],
    });
  }

  // Validate field types and lengths
  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({
      error: "Invalid title",
      message: "Title must be a non-empty string",
    });
  }

  if (typeof body !== "string" || body.trim().length === 0) {
    return res.status(400).json({
      error: "Invalid body",
      message: "Body must be a non-empty string",
    });
  }

  // Validate user_id - can be string or number
  if (typeof user_id !== "string" && typeof user_id !== "number") {
    return res.status(400).json({
      error: "Invalid user_id",
      message: "User ID must be a string or number",
    });
  }

  // Convert to string for consistency and check if it's not empty
  const userIdStr = String(user_id).trim();
  if (userIdStr.length === 0) {
    return res.status(400).json({
      error: "Invalid user_id",
      message: "User ID cannot be empty",
    });
  }

  next();
};

// ==================== ERROR HANDLING MIDDLEWARE ====================

/**
 * Global error handling middleware
 * Catches and handles any unhandled errors in the application
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ==================== API ROUTES ====================

/**
 * @route GET /api/posts
 * @description Retrieve all blog posts from the database
 * @access Public
 * @returns {Object[]} Array of post objects containing id, title, body, and user_id
 * @example
 * GET /api/posts
 * Response: [
 *   {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "title": "Sample Post",
 *     "body": "This is a sample blog post content",
 *     "user_id": "user123"
 *   }
 * ]
 */
app.get("/api/posts", async (req, res) => {
  try {
    // Query the posts table to retrieve all posts with specified fields
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, body, user_id")
      .order("id", { ascending: false }); // Order by ID (newest first)

    // Handle database errors
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Database error",
        message: "Failed to retrieve posts",
      });
    }

    // Return posts data directly (React expects array)
    res.status(200).json(data || []);
  } catch (err) {
    // Handle unexpected errors
    console.error("Unexpected error in GET /api/posts:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve posts",
    });
  }
});

/**
 * @route POST /api/posts
 * @description Create a new blog post
 * @access Public
 * @param {Object} req.body - Request body containing post data
 * @param {string} req.body.title - The title of the blog post
 * @param {string} req.body.body - The content/body of the blog post
 * @param {string} req.body.user_id - The ID of the user creating the post
 * @returns {Object} The created post object
 * @example
 * POST /api/posts
 * Body: {
 *   "title": "My New Post",
 *   "body": "This is the content of my new blog post",
 *   "user_id": "user123"
 * }
 * Response: {
 *   "success": true,
 *   "data": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "title": "My New Post",
 *     "body": "This is the content of my new blog post",
 *     "user_id": "user123"
 *   }
 * }
 */
app.post("/api/posts", validatePostData, async (req, res) => {
  try {
    const { title, body, user_id } = req.body;

    // Insert new post into the database
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title: title.trim(),
          body: body.trim(),
          user_id: String(user_id).trim(), // Ensure user_id is string
        },
      ])
      .select("id, title, body, user_id");

    // Handle database errors
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Database error",
        message: "Failed to create post",
      });
    }

    // Check if post was created successfully
    if (!data || data.length === 0) {
      return res.status(500).json({
        error: "Creation failed",
        message: "Post was not created",
      });
    }

    // Return created post data directly
    res.status(201).json(data[0]);
  } catch (err) {
    // Handle unexpected errors
    console.error("Unexpected error in POST /api/posts:", err);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create post",
    });
  }
});

/**
 * @route GET /api/health
 * @description Health check endpoint to verify server status
 * @access Public
 * @returns {Object} Server status information
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==================== ERROR HANDLING ====================

// Apply global error handling middleware
app.use(errorHandler);

// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ["GET /api/posts", "POST /api/posts", "GET /api/health"],
  });
});

// ==================== SERVER CONFIGURATION ====================

/**
 * Server port configuration
 * Uses environment variable PORT or defaults to 5000
 * @type {number}
 */
const PORT = process.env.PORT || 5000;

/**
 * Start the Express server
 * Listens on the specified port and logs server status
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
