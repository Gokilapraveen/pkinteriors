import React, { useState, useEffect } from "react";
import areasData from "../../JsonData/area.json";
import axios from "axios";

const API_BASE = "https://pkinteriors.onrender.com";

const QuotationForm = () => {
  const [ownerPhone, setOwnerPhone] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [rate, setRate] = useState(0);
  const [cost, setCost] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const areas = areasData;

  // Calculate cost whenever measurement or rate changes
  const calculateCost = (m, r) => {
    const val = parseFloat(m) * parseFloat(r);
    setCost(!isNaN(val) ? val : 0);
  };

  // Handle description selection to set rate
  const handleDescriptionChange = (value) => {
    setDescription(value);
    if (area) {
      const selected = areas[area].find((d) => d.label === value);
      if (selected) {
        setRate(selected.rate);
        calculateCost(measurement, selected.rate);
      }
    }
  };

  // Add item to table
  const handleAddItem = () => {
    if (!area || !description || !measurement) {
      alert("Fill all fields");
      return;
    }

    if (isNaN(Number(measurement))) {
      alert("Measurement must be a number");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(), // unique ID
        area,
        description,
        measurement: Number(measurement),
        rate: Number(rate),
        cost: Number(cost),
      },
    ]);

    // Reset inputs
    setDescription("");
    setMeasurement("");
    setRate(0);
    setCost(0);
  };

  // Remove item
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit quotation to backend
  const handleApprove = async () => {
    if (!ownerPhone) {
      alert("Enter owner phone number");
      return;
    }

    if (items.length === 0) {
      alert("Add at least one item");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/quotation`, {
        ownerPhone,
        items,
      });

      if (res.data.success) {
        alert("Quotation saved successfully ✅");
        setOwnerPhone("");
        setItems([]);
      } else {
        alert(res.data.error || "Failed to save quotation");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);

  return (
    <div style={{ padding: 20 }}>
      <h2>Quotation Form</h2>

      <input
        type="tel"
        placeholder="Owner Phone Number"
        value={ownerPhone}
        onChange={(e) => setOwnerPhone(e.target.value)}
        style={{ marginBottom: 20, width: "100%", padding: 8 }}
      />

      <div style={styles.formRow}>
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Select Area</option>
          {Object.keys(areas).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>

        <select
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          disabled={!area}
        >
          <option value="">Select Description</option>
          {area &&
            areas[area].map((d) => <option key={d.label}>{d.label}</option>)}
        </select>

        <input
          type="number"
          placeholder="Measurement"
          value={measurement}
          onChange={(e) => {
            setMeasurement(e.target.value);
            calculateCost(e.target.value, rate);
          }}
        />

        <input type="number" readOnly value={cost} placeholder="Cost" />

        <button onClick={handleAddItem}>➕ Add</button>
      </div>

      {items.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Area</th>
              <th>Description</th>
              <th>Measurement</th>
              <th>Rate</th>
              <th>Cost</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.area}</td>
                <td>{item.description}</td>
                <td>{item.measurement}</td>
                <td>₹{item.rate}</td>
                <td>₹{item.cost}</td>
                <td>
                  <button onClick={() => handleRemoveItem(item.id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Total: ₹ {totalCost.toLocaleString()}</h3>

      <button
        style={{ ...styles.approveBtn, opacity: loading ? 0.6 : 1 }}
        onClick={handleApprove}
        disabled={loading}
      >
        {loading ? "Sending..." : "✅ Send for Approval"}
      </button>
    </div>
  );
};

const styles = {
  formRow: {
    display: "grid",
    gridTemplateColumns: "1.5fr 2fr 1fr 1fr auto",
    gap: 10,
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 20,
  },
  approveBtn: {
    marginTop: 20,
    padding: "10px 30px",
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
  },
};

export default QuotationForm;
