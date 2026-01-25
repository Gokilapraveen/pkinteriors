import React, { useState, useRef } from "react";
import headerImg from "../images/quotation-header.jpg";
import footerImg from "../images/quotation-footer.jpg";

const ViewQuotation = () => {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const printRef = useRef();
  const API_BASE = "https://pkinteriors.onrender.com";
  /* ---------------- FETCH ---------------- */
  const fetchQuotation = async () => {
    if (!phone) {
      alert("Enter phone number");
      return;
    }

    try {
      setError("");
      setData(null);

      const res = await fetch(
        `${API_BASE}/api/quotation/${phone}`
      );
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "No data found");
        return;
      }

      setData(result);
    } catch {
      setError("Server error");
    }
  };

  /* ---------------- GROUP BY AREA ---------------- */
  const groupByArea = (items) => {
    return items.reduce((acc, item) => {
      (acc[item.area] = acc[item.area] || []).push(item);
      return acc;
    }, {});
  };

  /* ---------------- PRINT ---------------- */
  const handlePrint = () => {
    if (!data) return;

    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "", "width=900,height=700");

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation</title>
          <style>
            @page {
              size: A4;
              margin: 20mm 15mm 25mm 15mm;
            }

            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #000;
            }

            .page {
              position: relative;
              min-height: 297mm;
            }

            .header-img {
              width: 100%;
              margin-bottom: 10mm;
            }

            .footer-img {
              position: fixed;
              bottom: 0;
              left: 0;
              width: 100%;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              background: #e7ebdf;
              font-size: 14px;
            }

            th {
              background: #cfd6c3;
              border: 1px solid #8a8f84;
              padding: 10px;
              text-align: left;
            }

            td {
              border: 1px solid #8a8f84;
              padding: 10px;
              vertical-align: middle;
            }

            td:first-child {
              font-weight: bold;
            }

            .measurement {
              text-align: center;
              font-weight: 600;
            }

            tbody tr:nth-child(even) {
              background: #f2f5ec;
            }

            .grand-total td {
              font-weight: bold;
              background: #cfd6c3;
              font-size: 15px;
            }

            /* Prevent overlap with footer */
            .content {
              padding-bottom: 35mm;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const groupedItems = data ? groupByArea(data.items) : {};

  return (
    <div style={{ padding: 20 }}>
      <h2>View Quotation</h2>

      <input
        type="tel"
        placeholder="Owner Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: 8, marginRight: 10 }}
      />

      <button onClick={fetchQuotation}>🔍 Fetch</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <>
          {/* ---------------- PRINT CONTENT ---------------- */}
          <div ref={printRef} className="page">
            {/* HEADER */}
            <img src={headerImg} alt="Header" className="header-img" />

            {/* CONTENT */}
            <div className="content">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Area</th>
                    <th style={{ width: "45%" }}>Description</th>
                    <th style={{ width: "20%" }}>Measurement</th>
                    <th style={{ width: "20%" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([area, items]) =>
                    items.map((item, index) => (
                      <tr key={`${area}-${index}`}>
                        {index === 0 && (
                          <td rowSpan={items.length}>{area}</td>
                        )}
                        <td>{item.description}</td>
                        <td className="measurement">
                          {item.measurement} X {item.rate}
                        </td>
                        <td>{item.cost}</td>
                      </tr>
                    ))
                  )}

                  <tr className="grand-total">
                    <td colSpan={3} style={{ textAlign: "right" }}>
                      Grand Total
                    </td>
                    <td>{data.totalCost}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <img src={footerImg} alt="Footer" className="footer-img" />
          </div>

          {/* PRINT BUTTON */}
          <button
            onClick={handlePrint}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: "#1565c0",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            🖨️ Print Quotation
          </button>
        </>
      )}
    </div>
  );
};

export default ViewQuotation;
