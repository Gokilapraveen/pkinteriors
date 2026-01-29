import React, { useState, useEffect } from "react";
import axios from "axios";
import "./login.css";

const API_BASE = "https://pkinteriors.onrender.com";

function Login() {
  /* ---------------- USERS ---------------- */
  const database = [
    { username: "admin", password: "admin123" },
    { username: "user2", password: "pass2" },
  ];

  const errors = {
    uname: "Invalid username",
    pass: "Invalid password",
  };

  const [errorMessages, setErrorMessages] = useState({});
  const [quotations, setQuotations] = useState([]);

  /* ---------------- LOGIN ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    const { uname, pass } = document.forms[0];
    const user = database.find((u) => u.username === uname.value);

    if (!user) {
      setErrorMessages({ name: "uname", message: errors.uname });
      return;
    }

    if (user.password !== pass.value) {
      setErrorMessages({ name: "pass", message: errors.pass });
      return;
    }

    sessionStorage.setItem("User", user.username);
    sessionStorage.setItem("Loggedin", "true");
    fetchQuotations();
  };

  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="error">{errorMessages.message}</div>
    );

  /* ---------------- FETCH ---------------- */
  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/fetchquotations`);
      setQuotations(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("Loggedin")) {
      fetchQuotations();
    }
  }, []);

  /* ---------------- LOGOUT ---------------- */
  const logoutSession = () => {
    sessionStorage.clear();
    setQuotations([]);
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = (phone, id) => {
    setQuotations((prev) =>
      prev.map((group) =>
        group.owner_phone === phone
          ? {
              ...group,
              items: group.items.map((item) =>
                item.id === id ? { ...item, isEditing: true } : item
              ),
            }
          : group
      )
    );
  };

  const handleInputChange = (phone, id, field, value) => {
    setQuotations((prev) =>
      prev.map((group) =>
        group.owner_phone === phone
          ? {
              ...group,
              items: group.items.map((item) => {
                if (item.id !== id) return item;

                const updated = { ...item, [field]: value };

                if (field === "measurement" || field === "rate") {
                  const m = Number(updated.measurement || 0);
                  const r = Number(updated.rate || 0);
                  updated.cost = m * r;
                }

                return updated;
              }),
            }
          : group
      )
    );
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async (phone, id) => {
    const group = quotations.find((g) => g.owner_phone === phone);
    const item = group?.items.find((i) => i.id === id);
    if (!item) return;

    try {
      await axios.put(`${API_BASE}/api/quotation/${id}`, {
        area: item.area,
        description: item.description,
        measurement: Number(item.measurement),
        rate: Number(item.rate),
        cost: Number(item.cost),
      });

      setQuotations((prev) =>
        prev.map((group) =>
          group.owner_phone === phone
            ? {
                ...group,
                items: group.items.map((i) =>
                  i.id === id ? { ...i, isEditing: false } : i
                ),
              }
            : group
        )
      );

      alert("✅ Quotation updated");
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Update failed");
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (phone, id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await axios.delete(`${API_BASE}/api/quotation/${id}`);

      setQuotations((prev) =>
        prev.map((group) =>
          group.owner_phone === phone
            ? { ...group, items: group.items.filter((i) => i.id !== id) }
            : group
        )
      );

      alert("🗑️ Deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Delete failed");
    }
  };

  /* ---------------- LOGIN UI ---------------- */
  const renderForm = (
    <div className="form">
      <form className="login" onSubmit={handleSubmit}>
        <input name="uname" placeholder="Username" required />
        {renderErrorMessage("uname")}

        <input name="pass" type="password" placeholder="Password" required />
        {renderErrorMessage("pass")}

        <button>Login</button>
      </form>
    </div>
  );

  /* ---------------- DASHBOARD ---------------- */
  const renderDashboard = (
    <div className="dashboard">
      <h3>Welcome, {sessionStorage.getItem("User")}</h3>
      <button onClick={logoutSession}>Logout</button>

      {quotations.map((group) => (
        <div key={group.owner_phone}>
          <h4>
            📞 {group.owner_phone} | 💰 ₹{group.total_cost}
          </h4>

          <table border="1">
            <thead>
              <tr>
                <th>Area</th>
                <th>Description</th>
                <th>Measurement</th>
                <th>Rate</th>
                <th>Cost</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {group.items.map((item) => (
                <tr key={item.id}>
                  {["area", "description", "measurement", "rate"].map((field) => (
                    <td key={field}>
                      {item.isEditing ? (
                        <input
                          type={field === "area" || field === "description" ? "text" : "number"}
                          value={item[field]}
                          onChange={(e) =>
                            handleInputChange(
                              group.owner_phone,
                              item.id,
                              field,
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        item[field]
                      )}
                    </td>
                  ))}

                  <td>{item.cost}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>

                  <td>
                    {item.isEditing ? (
                      <button onClick={() => handleSave(group.owner_phone, item.id)}>
                        💾
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(group.owner_phone, item.id)}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(group.owner_phone, item.id)}>
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      {!sessionStorage.getItem("Loggedin") ? renderForm : renderDashboard}
    </div>
  );
}

export default Login;
