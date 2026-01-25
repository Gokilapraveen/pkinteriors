import React, { useState, useEffect } from "react";
import areasData from "../../JsonData/area.json";

const API_BASE = "https://pkinteriors.onrender.com";

const QuotationForm = () => {
  const [ownerPhone, setOwnerPhone] = useState("");
  const [areas] = useState(areasData);
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [rate, setRate] = useState(0);
  const [cost, setCost] = useState(0);
  const [items, setItems] = useState([]);

  /* ---------- COST ---------- */
  const calculateCost = (m, r) => {
    const qty = parseFloat(m);
    const rateNum = parseFloat(r);
    setCost(!isNaN(qty) && !isNaN(rateNum) ? qty * rateNum : 0);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    const selected = areas[area]?.find((d) => d.label === value);
    if (selected) {
      setRate(selected.rate);
      calculateCost(measurement, selected.rate);
    }
  };

  /* ---------- ADD ITEM ---------- */
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
        area,
        description,
        measurement: Number(measurement),
        rate: Number(rate),
        cost: Number(cost),
      },
    ]);

    setDescription("");
    setMeasurement("");
    setRate(0);
    setCost(0);
  };

  /* ---------- LOCAL STORAGE ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("quotationItems") || "[]");
    setItems(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("quotationItems", JSON.stringify(items));
  }, [items]);

  /* ---------- APPROVE ---------- */
  const handleApprove = async () => {
    if (!ownerPhone) {
      alert("Enter owner phone number");
      return;
    }

    if (items.length === 0) {
      alert("No items added");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerPhone, items }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Quotation saved successfully ✅");
        setItems([]);
        setOwnerPhone("");
        localStorage.removeItem("quotationItems");
      } else {
        alert(data.error || "Failed to save quotation");
      }
    } catch (err) {
      alert("Server error");
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
            areas[area].map((d) => (
              <option key={d.label}>{d.label}</option>
            ))}
        </select>

        <input
          type="text"
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

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Area</th>
            <th>Description</th>
            <th>Measurement</th>
            <th>Rate</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i}>
              <td>{row.area}</td>
              <td>{row.description}</td>
              <td>{row.measurement}</td>
              <td>₹{row.rate}</td>
              <td>₹{row.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Total: ₹ {totalCost.toLocaleString()}</h3>

      <button style={styles.approveBtn} onClick={handleApprove}>
        ✅ Send for Approval
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
