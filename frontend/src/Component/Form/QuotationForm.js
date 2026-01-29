import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://pkinteriors.onrender.com";

function Quotation() {
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [rate, setRate] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- ADD ITEM TO TABLE ---------------- */
  const addItem = () => {
    if (!area || !measurement || !rate) {
      alert("Please fill all item fields");
      return;
    }

    const cost = Number(measurement) * Number(rate);

    setItems([
      ...items,
      {
        area,
        description,
        measurement: Number(measurement),
        rate: Number(rate),
        cost,
      },
    ]);

    // reset inputs
    setArea("");
    setDescription("");
    setMeasurement("");
    setRate("");
  };

  /* ---------------- REMOVE ITEM ---------------- */
  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  /* ---------------- TOTAL ---------------- */
  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);

  /* ---------------- SUBMIT QUOTATION ---------------- */
  const submitQuotation = async () => {
    if (!phone || items.length === 0) {
      alert("Phone and at least one item required");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/quotation`, {
        phone,
        items,
        total_cost: totalCost,
      });

      alert("Quotation saved successfully ✅");

      // reset all
      setPhone("");
      setItems([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save quotation ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quotation Form</h2>

      {/* PHONE */}
      <input
        type="text"
        placeholder="Customer Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <hr />

      {/* ITEM INPUTS */}
      <input
        placeholder="Area"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        placeholder="Measurement"
        value={measurement}
        onChange={(e) => setMeasurement(e.target.value)}
      />

      <input
        type="number"
        placeholder="Rate"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
      />

      <button onClick={addItem}>Add Item</button>

      {/* TABLE */}
      {items.length > 0 && (
        <>
          <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
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
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.area}</td>
                  <td>{item.description}</td>
                  <td>{item.measurement}</td>
                  <td>{item.rate}</td>
                  <td>₹ {item.cost}</td>
                  <td>
                    <button onClick={() => removeItem(i)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Total: ₹ {totalCost}</h3>

          <button onClick={submitQuotation} disabled={loading}>
            {loading ? "Saving..." : "Submit Quotation"}
          </button>
        </>
      )}
    </div>
  );
}

export default Quotation;
