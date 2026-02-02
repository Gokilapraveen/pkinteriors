import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://pkinteriors.onrender.com";

export default function Quotation() {
  const role = sessionStorage.getItem("UserRole");
  const user = sessionStorage.getItem("User");

  const [customers, setCustomers] = useState([]);
  const [owner, setOwner] = useState(role === "admin" ? "" : user);

  const [items, setItems] = useState([
    { area: "", description: "", measurement: "", rate: "", cost: 0 }
  ]);

  const [errors, setErrors] = useState({});

  /* ---------------- FETCH CUSTOMERS (ADMIN) ---------------- */
  useEffect(() => {
    if (role === "admin") {
      axios
        .get(`${API_BASE}/api/customers`)
        .then(res => setCustomers(res.data))
        .catch(() => {});
    }
  }, [role]);

  /* ---------------- HELPERS ---------------- */
  const calculateCost = (m, r) =>
    Number(m || 0) * Number(r || 0);

  const totalCost = items.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0
  );

  /* ---------------- ITEM HANDLERS ---------------- */
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    updated[index].cost = calculateCost(
      updated[index].measurement,
      updated[index].rate
    );

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { area: "", description: "", measurement: "", rate: "", cost: 0 }
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const errs = {};

    if (!owner) errs.owner = "Customer is required";

    items.forEach((item, i) => {
      if (!item.area) errs[`area${i}`] = "Required";
      if (!item.measurement) errs[`measurement${i}`] = "Required";
      if (!item.rate) errs[`rate${i}`] = "Required";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post(`${API_BASE}/api/quotation`, {
        owner_phone: owner,
        total_cost: totalCost,
        items: items.map(i => ({
          area: i.area,
          description: i.description,
          measurement: Number(i.measurement),
          rate: Number(i.rate),
          cost: Number(i.cost)
        }))
      });

      alert("✅ Quotation created successfully");

      setItems([{ area: "", description: "", measurement: "", rate: "", cost: 0 }]);
      if (role === "admin") setOwner("");

    } catch (err) {
      alert("❌ Failed to create quotation");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="container mt-4">
      <h3 className="mb-4">Create Quotation</h3>

      <form onSubmit={handleSubmit}>
        {/* CUSTOMER */}
        {role === "admin" && (
          <div className="mb-3">
            <label className="form-label">Customer</label>
            <select
              className={`form-select ${errors.owner && "is-invalid"}`}
              value={owner}
              onChange={e => setOwner(e.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.phone} value={c.phone}>
                  {c.name} – {c.phone}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">{errors.owner}</div>
          </div>
        )}

        {/* ITEMS */}
        {items.map((item, index) => (
          <div key={index} className="card mb-3">
            <div className="card-body">
              <h6>Item {index + 1}</h6>

              <div className="row g-3">
                <div className="col-md-3">
                  <input
                    className={`form-control ${errors[`area${index}`] && "is-invalid"}`}
                    placeholder="Area"
                    value={item.area}
                    onChange={e =>
                      handleItemChange(index, "area", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-3">
                  <input
                    className="form-control"
                    placeholder="Description"
                    value={item.description}
                    onChange={e =>
                      handleItemChange(index, "description", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="number"
                    className={`form-control ${errors[`measurement${index}`] && "is-invalid"}`}
                    placeholder="Measurement"
                    value={item.measurement}
                    onChange={e =>
                      handleItemChange(index, "measurement", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="number"
                    className={`form-control ${errors[`rate${index}`] && "is-invalid"}`}
                    placeholder="Rate"
                    value={item.rate}
                    onChange={e =>
                      handleItemChange(index, "rate", e.target.value)
                    }
                  />
                </div>

                <div className="col-md-2">
                  <input
                    className="form-control"
                    value={item.cost}
                    disabled
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-danger mt-2"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* ACTIONS */}
        <div className="d-flex justify-content-between align-items-center">
          <button type="button" className="btn btn-secondary" onClick={addItem}>
            ➕ Add Item
          </button>

          <h5>Total: ₹ {totalCost}</h5>
        </div>

        <button className="btn btn-primary mt-3 w-100">
          Save Quotation
        </button>
      </form>
    </div>
  );
}
