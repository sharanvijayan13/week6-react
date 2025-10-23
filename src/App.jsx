import "./App.css";
import React, { useEffect, useState, useCallback, useMemo } from "react";

/**
 * @typedef {Object} Post
 * @property {number} id - Unique identifier for the post
 * @property {string} title - Title of the post
 * @property {string} body - Content/body of the post
 * @property {number} user_id - ID of the user who created the post
 */

/**
 * @typedef {Object} PostForm
 * @property {string} title - Title input value
 * @property {string} body - Body input value
 * @property {number} user_id - User ID input value
 */

/**
 * Main application component for managing posts with CRUD operations, search, and pagination
 *
 * Features:
 * - Display posts with pagination
 * - Add new posts
 * - Search/filter posts by title and body
 * - Responsive pagination controls
 *
 * @component
 * @returns {JSX.Element} The main App component
 */
function App() {
  // State management
  const [posts, setPosts] = useState(/** @type {Post[]} */ ([]));
  const [form, setForm] = useState(
    /** @type {PostForm} */ ({
      title: "",
      body: "",
      user_id: 1,
    })
  );
  const [search, setSearch] = useState(/** @type {string} */ (""));
  const [currentPage, setCurrentPage] = useState(/** @type {number} */ (1));
  const [isLoading, setIsLoading] = useState(/** @type {boolean} */ (false));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  // Configuration constants
  const POSTS_PER_PAGE = 3;
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  /**
   * Fetches all posts from the API
   * @async
   * @function fetchPosts
   * @returns {Promise<Post[]>} Array of posts from the API
   */
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/posts`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch posts";
      setError(errorMessage);
      console.error("Error fetching posts:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  /**
   * Loads posts when component mounts
   */
  useEffect(() => {
    const loadPosts = async () => {
      const postsData = await fetchPosts();
      setPosts(postsData);
    };

    loadPosts();
  }, [fetchPosts]);

  /**
   * Handles form submission for creating new posts
   * @async
   * @function handleSubmit
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      try {
        setIsLoading(true);
        setError(null);

        // Submit new post
        const response = await fetch(`${API_BASE_URL}/api/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh posts list after successful creation
        const updatedPosts = await fetchPosts();
        setPosts(updatedPosts);

        // Reset form
        setForm({ title: "", body: "", user_id: 1 });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create post";
        setError(errorMessage);
        console.error("Error creating post:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [form, fetchPosts, API_BASE_URL]
  );

  /**
   * Handles input changes for the post form
   * @function handleFormChange
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} event - Input change event
   */
  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: name === "user_id" ? parseInt(value) || 1 : value,
    }));
  }, []);

  /**
   * Handles search input changes and resets pagination
   * @function handleSearchChange
   * @param {React.ChangeEvent<HTMLInputElement>} event - Search input change event
   */
  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  /**
   * Handles pagination page changes
   * @function handlePageChange
   * @param {number} page - Page number to navigate to
   */
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  /**
   * Filters posts based on search term
   * Memoized to prevent unnecessary recalculations
   */
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;

    const searchTerm = search.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.body.toLowerCase().includes(searchTerm)
    );
  }, [posts, search]);

  /**
   * Calculates pagination data
   * Memoized to prevent unnecessary recalculations
   */
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    return {
      totalPages,
      currentPosts,
      hasPosts: currentPosts.length > 0,
    };
  }, [filteredPosts, currentPage, POSTS_PER_PAGE]);

  /**
   * Renders pagination buttons
   * @function renderPaginationButtons
   * @returns {JSX.Element[]} Array of pagination button elements
   */
  const renderPaginationButtons = useCallback(() => {
    return Array.from({ length: paginationData.totalPages }, (_, index) => {
      const pageNumber = index + 1;
      return (
        <button
          key={pageNumber}
          onClick={() => handlePageChange(pageNumber)}
          className={currentPage === pageNumber ? "active" : ""}
          disabled={isLoading}
        >
          {pageNumber}
        </button>
      );
    });
  }, [paginationData.totalPages, currentPage, handlePageChange, isLoading]);

  /**
   * Renders individual post item
   * @function renderPost
   * @param {Post} post - Post object to render
   * @returns {JSX.Element} Post element
   */
  const renderPost = useCallback(
    (post) => (
      <div key={post.id} className="post">
        <h3>{post.title}</h3>
        <p>{post.body}</p>
      </div>
    ),
    []
  );

  return (
    <div className="container">
      <header>
        <h2>XPosts</h2>
        {error && (
          <div className="error-message" role="alert">
            Error: {error}
          </div>
        )}
      </header>

      {/* Post Creation Form */}
      <section className="form-section" aria-labelledby="form-title">
        <h3 id="form-title">Add Post</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="post-title" className="sr-only">
              Post Title
            </label>
            <input
              id="post-title"
              name="title"
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={handleFormChange}
              required
              disabled={isLoading}
              aria-describedby="title-help"
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-body" className="sr-only">
              Post Body
            </label>
            <textarea
              id="post-body"
              name="body"
              placeholder="Body"
              value={form.body}
              onChange={handleFormChange}
              required
              disabled={isLoading}
              rows={4}
              aria-describedby="body-help"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-id" className="sr-only">
              User ID
            </label>
            <input
              id="user-id"
              name="user_id"
              type="number"
              placeholder="User ID"
              value={form.user_id}
              onChange={handleFormChange}
              required
              min={1}
              disabled={isLoading}
              aria-describedby="user-id-help"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-describedby="submit-help"
          >
            {isLoading ? "Adding..." : "Add Post"}
          </button>
        </form>
      </section>

      {/* Search Section */}
      <section className="search-section" aria-labelledby="search-title">
        <h3 id="search-title" className="sr-only">
          Search Posts
        </h3>
        <label htmlFor="search-input" className="sr-only">
          Search posts
        </label>
        <input
          id="search-input"
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={handleSearchChange}
          disabled={isLoading}
          aria-describedby="search-help"
        />
      </section>

      {/* Posts Display Section */}
      <section className="posts-section" aria-labelledby="posts-title">
        <h3 id="posts-title" className="sr-only">
          Posts
        </h3>
        {isLoading && posts.length === 0 ? (
          <div className="loading" role="status" aria-live="polite">
            Loading posts...
          </div>
        ) : paginationData.hasPosts ? (
          <div className="posts-list">
            {paginationData.currentPosts.map(renderPost)}
          </div>
        ) : (
          <div className="no-posts" role="status">
            <p>No posts found</p>
          </div>
        )}
      </section>

      {/* Pagination Section */}
      {paginationData.totalPages > 1 && (
        <nav className="pagination" aria-label="Posts pagination">
          {renderPaginationButtons()}
        </nav>
      )}
    </div>
  );
}

export default App;
