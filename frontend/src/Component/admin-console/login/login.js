import React, { useState, useEffect } from "react";
import axios from "axios";
import "./login.css";

const API_BASE = "https://pkinteriors.onrender.com";

function Login() {
  const database = [
    { username: "admin", password: "admin123" },
    { username: "user2", password: "pass2" },
  ];

  const errors = { uname: "Invalid username", pass: "Invalid password" };

  const [errorMessages, setErrorMessages] = useState({});
  const [quotations, setQuotations] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { uname, pass } = document.forms[0];
    const user = database.find((u) => u.username === uname.value);

    if (!user) return setErrorMessages({ name: "uname", message: errors.uname });
    if (user.password !== pass.value)
      return setErrorMessages({ name: "pass", message: errors.pass });

    sessionStorage.setItem("User", user.username);
    sessionStorage.setItem("Loggedin", "true");
    fetchQuotations();
  };

  const renderErrorMessage = (name) =>
    name === errorMessages.name && <div className="error">{errorMessages.message}</div>;

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/fetchquotations`);
      setQuotations(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("Loggedin")) fetchQuotations();
  }, []);

  const logoutSession = () => {
    sessionStorage.clear();
    setQuotations([]);
  };

  const handleEdit = (id) => {
    setQuotations((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.id === id ? { ...item, isEditing: true } : item
        ),
      }))
    );
  };

  const handleInputChange = (id, field, value) => {
    setQuotations((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "measurement" || field === "rate") {
            updated.cost = Number(updated.measurement || 0) * Number(updated.rate || 0);
          }
          return updated;
        }),
      }))
    );
  };

  const handleSave = async (id) => {
    let itemToUpdate;
    quotations.forEach((group) => {
      group.items.forEach((item) => {
        if (item.id === id) itemToUpdate = item;
      });
    });

    if (!itemToUpdate) return;

    try {
      await axios.put(`${API_BASE}/api/quotation/${id}`, {
        area: itemToUpdate.area,
        description: itemToUpdate.description,
        measurement: Number(itemToUpdate.measurement),
        rate: Number(itemToUpdate.rate),
        cost: Number(itemToUpdate.cost),
      });

      setQuotations((prev) =>
        prev.map((group) => ({
          ...group,
          items: group.items.map((i) =>
            i.id === id ? { ...i, isEditing: false } : i
          ),
        }))
      );

      alert("✅ Quotation updated");
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await axios.delete(`${API_BASE}/api/quotation/${id}`);

      setQuotations((prev) =>
        prev.map((group) => ({
          ...group,
          items: group.items.filter((i) => i.id !== id),
        }))
      );

      alert("🗑️ Deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Delete failed");
    }
  };

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

  const renderDashboard = (
    <div className="dashboard">
      <h3>Welcome, {sessionStorage.getItem("User")}</h3>
      <button onClick={logoutSession}>Logout</button>

      {quotations.map((group) => (
        <div key={group.owner_phone}>
          <h4>📞 {group.owner_phone} | 💰 ₹{group.total_cost}</h4>

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
                            handleInputChange(item.id, field, e.target.value)
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
                      <button onClick={() => handleSave(item.id)}>💾</button>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(item.id)}>✏️</button>
                        <button onClick={() => handleDelete(item.id)}>🗑️</button>
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

  return <div className="app">{!sessionStorage.getItem("Loggedin") ? renderForm : renderDashboard}</div>;
}

export default Login;
