import "./App.css";
import React, { useEffect, useState } from "react";

function App() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", user_id: 1 });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/posts`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${import.meta.env.VITE_API_URL}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const updated = await fetch(
      `${import.meta.env.VITE_API_URL}/api/posts`
    ).then((r) => r.json());
    setPosts(updated);
    setForm({ title: "", body: "", user_id: 1 });
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="container">
      <h2>XPosts</h2>

      <div className="form-section">
        <h3>Add Post</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="User ID"
            value={form.user_id}
            onChange={(e) =>
              setForm({ ...form, user_id: parseInt(e.target.value) })
            }
            required
            min={1}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search posts.."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="posts-section">
        {currentPosts.length > 0 ? (
          currentPosts.map((p) => (
            <div key={p.id} className="post">
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))
        ) : (
          <p>No posts found</p>
        )}
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
