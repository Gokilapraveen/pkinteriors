import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CreateQuotation() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([
    { area: "", description: "", measurement: 0, rate: 0, cost: 0 },
  ]);
  const [gstPercent, setGstPercent] = useState(18);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem("token");

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get("/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, [token]);

  // Update cost whenever measurement or rate changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === "area" || field === "description" ? value : Number(value);
    newItems[index].cost = newItems[index].measurement * newItems[index].rate;
    setItems(newItems);
    calculateTotal(newItems);
  };

  const calculateTotal = (itemsArr) => {
    const subtotal = itemsArr.reduce((sum, i) => sum + i.cost, 0);
    const gstAmount = (subtotal * gstPercent) / 100;
    setTotal(subtotal + gstAmount);
  };

  const addItem = () => setItems([...items, { area: "", description: "", measurement: 0, rate: 0, cost: 0 }]);
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotal(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return alert("Select a customer!");
    if (items.length === 0) return alert("Add at least one item!");

    try {
      await axios.post(
        "/api/quotation",
        { customer_id: customerId, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Quotation created!");
      setItems([{ area: "", description: "", measurement: 0, rate: 0, cost: 0 }]);
      setCustomerId("");
      setTotal(0);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create quotation");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Create Quotation</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Customer</label>
          <select
            className="form-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type}) - {c.phone}
              </option>
            ))}
          </select>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="card p-3 mb-3">
            <h6>Item {idx + 1}</h6>
            <div className="row">
              <div className="col-md-3 mb-2">
                <input
                  className="form-control"
                  placeholder="Area"
                  value={item.area}
                  onChange={(e) => handleItemChange(idx, "area", e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3 mb-2">
                <input
                  className="form-control"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                />
              </div>
              <div className="col-md-2 mb-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Measurement"
                  value={item.measurement}
                  onChange={(e) => handleItemChange(idx, "measurement", e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="col-md-2 mb-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="col-md-1 mb-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cost"
                  value={item.cost}
                  readOnly
                />
              </div>
              <div className="col-md-1 mb-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  ❌
                </button>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary mb-3" onClick={addItem}>
          ➕ Add Item
        </button>

        <div className="mb-3">
          <h5>Total (with {gstPercent}% GST): ₹{total.toFixed(2)}</h5>
        </div>

        <button type="submit" className="btn btn-primary">
          Submit Quotation
        </button>
      </form>
    </div>
  );
}
