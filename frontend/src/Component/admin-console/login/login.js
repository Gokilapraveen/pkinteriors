import React, { useState } from "react";
import axios from "axios";

export default function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + "/login",
        { username, password }
      );

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <form onSubmit={handleSubmit} className="w-50 mx-auto">
        <input
          className="form-control mb-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="form-control mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
