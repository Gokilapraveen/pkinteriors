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

  const handleSubmit = (event) => {
    event.preventDefault();
    const { uname, pass } = document.forms[0];
    const userData = database.find((user) => user.username === uname.value);

    if (userData) {
      if (userData.password !== pass.value) {
        setErrorMessages({ name: "pass", message: errors.pass });
      } else {
        sessionStorage.setItem("User", userData.username);
        sessionStorage.setItem("Loggedin", "true");
        fetchQuotations();
      }
    } else {
      setErrorMessages({ name: "uname", message: errors.uname });
    }
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
    sessionStorage.removeItem("User");
    sessionStorage.removeItem("Loggedin");
    setQuotations([]);
  };

  const handleEdit = (phone, idx) => {
    setQuotations((prev) =>
      prev.map((group) =>
        group.owner_phone === phone
          ? {
              ...group,
              items: group.items.map((item, i) =>
                i === idx ? { ...item, isEditing: true } : item
              ),
            }
          : group
      )
    );
  };

  const handleInputChange = (e, phone, idx, field) => {
    const value = e.target.value;
    setQuotations((prev) =>
      prev.map((group) =>
        group.owner_phone === phone
          ? {
              ...group,
              items: group.items.map((item, i) =>
                i === idx ? { ...item, [field]: value } : item
              ),
            }
          : group
      )
    );
  };

  // ---------- SAVE to DB ----------
  const handleSave = async (phone, idx) => {
    const itemToSave = quotations.find((group) => group.owner_phone === phone).items[idx];
    try {
      await axios.put(`${API_BASE}/api/quotation/${itemToSave.id}`, {
        area: itemToSave.area,
        description: itemToSave.description,
        measurement: itemToSave.measurement,
        rate: itemToSave.rate,
        cost: itemToSave.cost,
      });

      // Exit edit mode after saving
      setQuotations((prev) =>
        prev.map((group) =>
          group.owner_phone === phone
            ? {
                ...group,
                items: group.items.map((item, i) =>
                  i === idx ? { ...item, isEditing: false } : item
                ),
              }
            : group
        )
      );
      alert("Quotation updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save changes.");
    }
  };

  // ---------- DELETE from DB ----------
  const handleDelete = async (phone, idx) => {
    if (!window.confirm("Are you sure you want to delete this row?")) return;

    const itemToDelete = quotations.find((group) => group.owner_phone === phone).items[idx];
    try {
      await axios.delete(`${API_BASE}/api/quotation/${itemToDelete.id}`);
      setQuotations((prev) =>
        prev.map((group) =>
          group.owner_phone === phone
            ? { ...group, items: group.items.filter((_, i) => i !== idx) }
            : group
        )
      );
      alert("Quotation deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete quotation.");
    }
  };

  // ---------- JSX ----------
  const renderForm = (
    <div className="form">
      <div className="logincontainer">
        <div className="screen">
          <div className="screen__content">
            <form className="login" onSubmit={handleSubmit}>
              <div className="login__field">
                <i className="login__icon fas fa-user"></i>
                <input type="text" className="login__input" name="uname" required placeholder="Username" />
                {renderErrorMessage("uname")}
              </div>
              <div className="login__field">
                <i className="login__icon fas fa-lock"></i>
                <input type="password" className="login__input" name="pass" required placeholder="Password" />
                {renderErrorMessage("pass")}
              </div>
              <button className="button login__submit">
                <span className="button__text">Log In</span>
                <i className="button__icon fas fa-chevron-right"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = (
    <div className="dashboard">
      <h3>Welcome, {sessionStorage.getItem("User")}</h3>
      <button className="btn btn-danger mb-3" onClick={logoutSession}>
        Logout
      </button>

      <h4>All Quotations</h4>
      {quotations.length === 0 ? (
        <p>No quotations found.</p>
      ) : (
        quotations.map((group) => (
          <div key={group.owner_phone} className="mb-4">
            <h5>Phone: {group.owner_phone} | Total Cost: {group.total_cost}</h5>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Description</th>
                  <th>Measurement</th>
                  <th>Rate</th>
                  <th>Cost</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.isEditing ? <input value={item.area} onChange={(e) => handleInputChange(e, group.owner_phone, idx, "area")} /> : item.area}</td>
                    <td>{item.isEditing ? <input value={item.description} onChange={(e) => handleInputChange(e, group.owner_phone, idx, "description")} /> : item.description}</td>
                    <td>{item.isEditing ? <input type="number" value={item.measurement} onChange={(e) => handleInputChange(e, group.owner_phone, idx, "measurement")} /> : item.measurement}</td>
                    <td>{item.isEditing ? <input type="number" value={item.rate} onChange={(e) => handleInputChange(e, group.owner_phone, idx, "rate")} /> : item.rate}</td>
                    <td>{item.isEditing ? <input type="number" value={item.cost} onChange={(e) => handleInputChange(e, group.owner_phone, idx, "cost")} /> : item.cost}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>
                      {item.isEditing ? (
                        <button className="save-btn" onClick={() => handleSave(group.owner_phone, idx)}>💾</button>
                      ) : (
                        <>
                          <button className="edit-btn" onClick={() => handleEdit(group.owner_phone, idx)}>✏️</button>
                          <button className="delete-btn" onClick={() => handleDelete(group.owner_phone, idx)}>🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );

  return <div className="app">{!sessionStorage.getItem("Loggedin") ? renderForm : renderDashboard}</div>;
}

export default Login;
