import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://pkinteriors.onrender.com";

export default function ViewQuotation() {
  const [quotations, setQuotations] = useState([]);
  const isAdmin = sessionStorage.getItem("UserRole") === "admin";

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    const res = await axios.get(`${API_BASE}/api/fetchquotations`);

    setQuotations(
      res.data.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          isEditing: false
        }))
      }))
    );
  };

  const handleChange = (id, field, value) => {
    setQuotations(prev =>
      prev.map(group => ({
        ...group,
        items: group.items.map(item => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          updated.cost =
            Number(updated.measurement || 0) * Number(updated.rate || 0);
          return updated;
        })
      }))
    );
  };

  const handleSave = async (id) => {
    let item;

    quotations.forEach(group =>
      group.items.forEach(i => {
        if (i.id === id) item = i;
      })
    );

    await axios.put(`${API_BASE}/api/quotation/${id}`, item);

    setQuotations(prev =>
      prev.map(group => ({
        ...group,
        items: group.items.map(i =>
          i.id === id ? { ...i, isEditing: false } : i
        )
      }))
    );
  };

  return (
    <div className="dashboard">
      <h3>Admin – All Quotations</h3>

      {quotations.map(group => (
        <div key={group.owner_phone}>
          <h4>📞 {group.owner_phone}</h4>

          <table border="1">
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
              {group.items.map(item => (
                <tr key={item.id}>
                  {["area", "description", "measurement", "rate"].map(field => (
                    <td key={field}>
                      {isAdmin && item.isEditing ? (
                        <input
                          value={item[field]}
                          onChange={e =>
                            handleChange(item.id, field, e.target.value)
                          }
                        />
                      ) : (
                        item[field]
                      )}
                    </td>
                  ))}
                  <td>{item.cost}</td>
                  <td>
                    {isAdmin &&
                      (item.isEditing ? (
                        <button onClick={() => handleSave(item.id)}>💾</button>
                      ) : (
                        <button
                          onClick={() =>
                            setQuotations(prev =>
                              prev.map(group => ({
                                ...group,
                                items: group.items.map(i =>
                                  i.id === item.id
                                    ? { ...i, isEditing: true }
                                    : i
                                )
                              }))
                            )
                          }
                        >
                          ✏️
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
