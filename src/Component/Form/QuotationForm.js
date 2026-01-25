import React, { useState } from "react";
import areasData from "../../JsonData/area.json";


const QuotationForm = () => {
  const [areas, setAreas] = useState(areasData);
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [rate, setRate] = useState(0);
  const [cost, setCost] = useState(0);
  const [items, setItems] = useState([]);

  /* ---------- CALCULATIONS ---------- */
  const calculateCost = (measurementValue, rateValue) => {
    const qty = parseFloat(measurementValue);
    setCost(!isNaN(qty) ? qty * rateValue : 0);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    const selected = areas[area].find((d) => d.label === value);
    setRate(selected.rate);
    calculateCost(measurement, selected.rate);
  };

  /* ---------- ADD ITEM ---------- */
  const handleAddItem = () => {
    if (!area || !description || !measurement) {
      alert("Fill all fields");
      return;
    }

    setItems([
      ...items,
      { area, description, measurement, rate, cost },
    ]);

    setDescription("");
    setMeasurement("");
    setRate(0);
    setCost(0);
  };

  /* ---------- ADD AREA ---------- */
  const handleAddArea = () => {
    const newArea = prompt("Enter Area Name");
    if (!newArea) return;

    if (areas[newArea]) {
      alert("Area already exists");
      return;
    }

    setAreas({ ...areas, [newArea]: [] });
  };

  /* ---------- APPROVE ---------- */
  const handleApprove = () => {
    console.log("Send to manager:", items);
    alert("Quotation sent for approval");
  };

  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Quotation Form</h2>
        <button onClick={handleAddArea}>➕ Add Area</button>
      </div>

      {/* FORM */}
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

      {/* TABLE */}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
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
